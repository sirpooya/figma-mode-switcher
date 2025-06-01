figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'apply-theme-chain') return;

  const chain = msg.chain;

  for (const { collectionId, modeId } of chain) {
    try {
      figma.root.setVariableModeId(collectionId, modeId);
    } catch (e) {
      figma.notify(`❌ Failed to apply modeId ${modeId}`);
    }
  }

  figma.notify("✅ Theme chain applied");
};