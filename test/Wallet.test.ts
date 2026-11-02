import { expect } from "chai";
import { network } from "hardhat";

describe("Wallet multifirma", function () {
  let ethers: any, wallet: any, owners: any[], recipient: any, stranger: any;
  beforeEach(async function () {
    ({ ethers } = await network.create());
    const signers = await ethers.getSigners();
    owners = signers.slice(0, 3); recipient = signers[3]; stranger = signers[4];
    wallet = await ethers.deployContract("Wallet", [await Promise.all(owners.map(owner => owner.getAddress())), 2]);
    await wallet.waitForDeployment();
    await (await owners[0].sendTransaction({ to: await wallet.getAddress(), value: ethers.parseEther("1") })).wait();
  });

  it("conserva los propietarios y el umbral", async function () {
    expect(await wallet.getOwners()).to.deep.equal(await Promise.all(owners.map(owner => owner.getAddress())));
    expect(await wallet.minApprovals()).to.equal(2n);
  });
  it("rechaza listas vacías, direcciones nulas y propietarios repetidos", async function () {
    await expect(ethers.deployContract("Wallet", [[], 1])).to.be.revertedWithCustomError(wallet, "InvalidOwners");
    await expect(ethers.deployContract("Wallet", [[ethers.ZeroAddress], 1])).to.be.revertedWithCustomError(wallet, "InvalidOwners");
    await expect(ethers.deployContract("Wallet", [[owners[0].address, owners[0].address], 1])).to.be.revertedWithCustomError(wallet, "DuplicateOwner");
  });
  it("rechaza umbrales nulos o superiores al número de propietarios", async function () {
    await expect(ethers.deployContract("Wallet", [[owners[0].address], 0])).to.be.revertedWithCustomError(wallet, "InvalidThreshold");
    await expect(ethers.deployContract("Wallet", [[owners[0].address], 2])).to.be.revertedWithCustomError(wallet, "InvalidThreshold");
  });
  it("registra los depósitos", async function () {
    await expect(owners[0].sendTransaction({ to: await wallet.getAddress(), value: 100n }))
      .to.emit(wallet, "Deposit").withArgs(owners[0].address, 100n);
  });
  it("crea una propuesta sin aprobarla automáticamente", async function () {
    await expect(wallet.createTransfer(100n, recipient.address)).to.emit(wallet, "TransferCreated").withArgs(0n, owners[0].address, recipient.address, 100n);
    const [transfer] = await wallet.getTransfers();
    expect([transfer.amount, transfer.recipient, transfer.approvals, transfer.executed]).to.deep.equal([100n, recipient.address, 0n, false]);
  });
  it("permite crear y aprobar únicamente a los propietarios", async function () {
    await expect(wallet.connect(stranger).createTransfer(100n, recipient.address)).to.be.revertedWithCustomError(wallet, "OnlyOwner");
    await wallet.createTransfer(100n, recipient.address);
    await expect(wallet.connect(stranger).approveTransfer(0n)).to.be.revertedWithCustomError(wallet, "OnlyOwner");
  });
  it("rechaza destinatarios nulos e importes cero", async function () {
    await expect(wallet.createTransfer(100n, ethers.ZeroAddress)).to.be.revertedWithCustomError(wallet, "InvalidRecipient");
    await expect(wallet.createTransfer(0n, recipient.address)).to.be.revertedWithCustomError(wallet, "InvalidAmount");
  });
  it("mantiene los fondos hasta alcanzar el umbral", async function () {
    await wallet.createTransfer(100n, recipient.address);
    await wallet.approveTransfer(0n);
    const [transfer] = await wallet.getTransfers();
    expect(transfer.approvals).to.equal(1n);
    expect(transfer.executed).to.equal(false);
    expect(await ethers.provider.getBalance(await wallet.getAddress())).to.equal(ethers.parseEther("1"));
  });
  it("envía el importe al alcanzar las firmas necesarias", async function () {
    await wallet.createTransfer(100n, recipient.address);
    await wallet.approveTransfer(0n);
    await expect(wallet.connect(owners[1]).approveTransfer(0n)).to.changeEtherBalances(ethers, [wallet, recipient], [-100n, 100n]);
    expect((await wallet.getTransfers())[0].executed).to.equal(true);
  });
  it("rechaza aprobaciones duplicadas y transferencias ejecutadas o inexistentes", async function () {
    await expect(wallet.approveTransfer(9n)).to.be.revertedWithCustomError(wallet, "UnknownTransfer");
    await wallet.createTransfer(100n, recipient.address);
    await wallet.approveTransfer(0n);
    await expect(wallet.approveTransfer(0n)).to.be.revertedWithCustomError(wallet, "AlreadyApproved");
    await wallet.connect(owners[1]).approveTransfer(0n);
    await expect(wallet.connect(owners[2]).approveTransfer(0n)).to.be.revertedWithCustomError(wallet, "AlreadyExecuted");
  });
  it("revierte la última aprobación si faltan fondos y permite reintentar", async function () {
    const amount = ethers.parseEther("2");
    await wallet.createTransfer(amount, recipient.address);
    await wallet.approveTransfer(0n);
    await expect(wallet.connect(owners[1]).approveTransfer(0n)).to.be.revertedWithCustomError(wallet, "InsufficientBalance");
    expect(await wallet.approved(owners[1].address, 0n)).to.equal(false);
    expect((await wallet.getTransfers())[0].approvals).to.equal(1n);
    await owners[0].sendTransaction({ to: await wallet.getAddress(), value: ethers.parseEther("1") });
    await wallet.connect(owners[1]).approveTransfer(0n);
    expect((await wallet.getTransfers())[0].executed).to.equal(true);
  });
  it("envía a contratos que necesitan gas adicional al recibir ETH", async function () {
    const receiver = await ethers.deployContract("GasReceiver");
    await wallet.createTransfer(100n, await receiver.getAddress());
    await wallet.approveTransfer(0n);
    await wallet.connect(owners[1]).approveTransfer(0n);
    expect(await receiver.received()).to.equal(100n);
  });
  it("revierte el estado cuando el destinatario rechaza el envío", async function () {
    const receiver = await ethers.deployContract("RejectingReceiver");
    await wallet.createTransfer(100n, await receiver.getAddress());
    await wallet.approveTransfer(0n);
    await expect(wallet.connect(owners[1]).approveTransfer(0n)).to.be.revertedWithCustomError(wallet, "TransferFailed");
    expect((await wallet.getTransfers())[0].executed).to.equal(false);
    expect(await wallet.approved(owners[1].address, 0n)).to.equal(false);
  });
  it("impide ejecutar otra vez la misma propuesta durante una reentrada", async function () {
    const receiver = await ethers.deployContract("ReentrantReceiver");
    const guarded = await ethers.deployContract("Wallet", [[owners[0].address, await receiver.getAddress()], 1]);
    await owners[0].sendTransaction({ to: await guarded.getAddress(), value: 1000n });
    await guarded.createTransfer(100n, await receiver.getAddress());
    await receiver.configure(await guarded.getAddress(), 0n);
    await expect(guarded.approveTransfer(0n)).to.changeEtherBalances(ethers, [guarded, receiver], [-100n, 100n]);
    expect(await receiver.reentered()).to.equal(false);
    expect((await guarded.getTransfers())[0].executed).to.equal(true);
  });
});
