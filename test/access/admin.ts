import {expect, use} from 'chai'
import {deployContract, MockProvider, solidity} from 'ethereum-waffle'
import AdminTest from '../../build/AdminTest.json'

use(solidity)

describe('Admin', () => {
	const provider = new MockProvider()
	const [deployer, newAdmin] = provider.getWallets()

	describe('Admin: onlyAdmin', () => {
		describe('success', () => {
			it('functions can be executed if you have administrative privileges.', async () => {
				const admin = await deployContract(deployer, AdminTest)
				const value = await admin.getValueOnlyAdmin()
				expect(value.toNumber()).to.be.equal(1)
			})
		})
		describe('fail', () => {
			it('if you donot have administrative privileges, the function cannot be executed.', async () => {
				const admin = await deployContract(deployer, AdminTest)
				const otherAdmin = admin.connect(newAdmin)
				await expect(otherAdmin.getValueOnlyAdmin()).to.be.revertedWith(
					'admin only.'
				)
			})
		})
	})
	describe('Admin: addAdmin', () => {
		describe('success', () => {
			it('administrators can add an administrator.', async () => {
				const admin = await deployContract(deployer, AdminTest)
				const otherAdmin = admin.connect(newAdmin)
				await admin.addAdmin(newAdmin.address)
				const value = await otherAdmin.getValueOnlyAdmin()
				expect(value.toNumber()).to.be.equal(1)
			})
		})
		describe('fail', () => {
			it('no one but the administrator can add an administrator.', async () => {
				const admin = await deployContract(deployer, AdminTest)
				const otherAdmin = admin.connect(newAdmin)
				await expect(otherAdmin.addAdmin(newAdmin.address)).to.be.revertedWith(
					'admin only.'
				)
			})
		})
	})
	describe('Admin: deleteAdmin', () => {
		describe('success', () => {
			it('administrators can add an administrator.', async () => {
				const admin = await deployContract(deployer, AdminTest)
				await admin.deleteAdmin(deployer.address)
				await expect(admin.getValueOnlyAdmin()).to.be.revertedWith(
					'admin only.'
				)
			})
		})
		describe('fail', () => {
			it('no one but the administrator can add an administrator.', async () => {
				const admin = await deployContract(deployer, AdminTest)
				const otherAdmin = admin.connect(newAdmin)
				await expect(
					otherAdmin.deleteAdmin(newAdmin.address)
				).to.be.revertedWith('admin only.')
				const value = await admin.getValueOnlyAdmin()
				expect(value.toNumber()).to.be.equal(1)
			})
		})
	})
})
