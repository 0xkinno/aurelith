import { expect } from "chai";
import hardhat from "hardhat";

const { ethers } = hardhat;

describe("AurelithFccInstructionSender", () => {
  it("resolves its registered extension and permits only Core to forward", async () => {
    const [core, attacker, tee] = await ethers.getSigners();
    const manager = await ethers.deployContract("MockTeeManager");
    const sender = await ethers.deployContract("AurelithFccInstructionSender", [core.address, await manager.getAddress(), await manager.getAddress()]);
    await manager.register(0x10000, await sender.getAddress());
    await manager.setTeeIds([tee.address]);
    await expect(sender.setExtensionId()).to.emit(sender, "ExtensionIdResolved").withArgs(0x10000);
    await expect(sender.connect(attacker).sendSettlementInstruction(ethers.id("p"), "0x1234", attacker.address)).to.be.revertedWithCustomError(sender, "Unauthorized");
    await expect(sender.connect(core).sendSettlementInstruction(ethers.id("p"), "0x1234", core.address))
      .to.emit(sender, "InstructionSent");
  });
});
