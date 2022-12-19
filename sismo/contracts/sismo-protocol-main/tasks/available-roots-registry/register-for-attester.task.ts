import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployer } from '../deploy-tasks/utils';

import { AvailableRootsRegistry__factory } from '../../types';
import { manualConfirmValidity } from '../utils/confirm';
import { BigNumber, Signer } from 'ethers';
import { CommonTaskOptions, wrapCommonOptions } from '../utils';
import { getRelayerSigner } from '../utils/relayer';

export type RegisterForAttesterArgs = {
  root: string;
  attester: string;
  availableRootsRegistryAddress?: string;
  relayed?: boolean;
  options?: CommonTaskOptions;
};

async function action(
  { root, attester, relayed, options, availableRootsRegistryAddress }: RegisterForAttesterArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  if (root === '0') {
    if (options?.log) {
      console.log(`
      root undefined for attester ${attester}. Not running the task.
    `);
    }
    return;
  }

  const signer = relayed ? await getRelayerSigner() : ((await getDeployer(hre)) as Signer);

  const availableRootsRegistry = AvailableRootsRegistry__factory.connect(
    availableRootsRegistryAddress || (await hre.deployments.get(`AvailableRootsRegistry`)).address,
    signer
  );

  const isRootAlreadyRegistered = await availableRootsRegistry.isRootAvailableForAttester(
    attester,
    BigNumber.from(root)
  );
  if (isRootAlreadyRegistered) {
    if (options?.log) {
      console.log(`
      Root: ${root} already registered for attester ${availableRootsRegistry.address}`);
    }
    return;
  }

  const actionRegisterRootForAttesterArgs = {
    availableRootsRegistry: availableRootsRegistry.address,
    root: root,
    attester,
  };
  await manualConfirmValidity(actionRegisterRootForAttesterArgs, options);
  const tx = await availableRootsRegistry.registerRootForAttester(
    actionRegisterRootForAttesterArgs.attester,
    BigNumber.from(actionRegisterRootForAttesterArgs.root)
  );
  await tx.wait();
}

task('register-for-attester')
  .addParam('root', 'Root to update')
  .addParam('attester', 'Register for this Attester')
  .addOptionalParam('availableRootsRegistryAddress', 'Root to update')
  .addFlag('relayed', 'to use with relayer')
  .setAction(wrapCommonOptions(action));
