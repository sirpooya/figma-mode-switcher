figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'apply-scheme') {
    const selected = figma.currentPage.selection;

    if (selected.length === 0) {
      figma.notify("No frame selected");
      return;
    }

    const scheme = msg.scheme; // e.g., { "Primary": "Dark", "Typography": "Large" }

    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();
    for (const collection of variableCollections) {
      const newMode = collection.modes.find(m => m.name === scheme[collection.name]);
      if (newMode) {
        figma.root.setVariableModeId(collection.id, newMode.modeId); // Affects whole document
      }
    }

    figma.notify("Scheme applied!");
  }
};