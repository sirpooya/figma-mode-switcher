// Show the plugin UI with increased height to accommodate dropdown
figma.showUI(__html__, { width: 300, height: 300 });

let collectionsData = [];

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'apply-theme-mode') {
    try {
      const { selectedMode } = msg.data;
      
      console.log(`Looking for mode "${selectedMode}" in theme collections`);
      
      // Find theme collections (🌈 Theme, 🌈 Theme 2, 🌈 Theme 3, 🌈 Theme 4)
      const themeCollectionNames = ['🌈 Theme', '🌈 Theme 2', '🌈 Theme 3', '🌈 Theme 4'];
      
      let applied = false;
      let appliedCollections = [];
      let sourceCollection = null;
      
      for (const themeCollectionName of themeCollectionNames) {
        try {
          // Find the collection in our loaded data
          const themeCollection = collectionsData.find(c => c.name === themeCollectionName);
          
          if (!themeCollection) {
            console.log(`Collection "${themeCollectionName}" not found in loaded collections`);
            continue;
          }
          
          // Find the mode in this collection
          const mode = themeCollection.modes.find(m => m.name === selectedMode);
          
          if (!mode) {
            console.log(`Mode "${selectedMode}" not found in collection "${themeCollectionName}"`);
            continue;
          }
          
          console.log(`Found mode "${selectedMode}" in collection "${themeCollectionName}"`);
          sourceCollection = themeCollectionName;
          
          // Get the actual collection object
          const collection = await figma.variables.getVariableCollectionByIdAsync(themeCollection.id);
          
          if (!collection) {
            console.log(`Could not get collection object for "${themeCollectionName}"`);
            continue;
          }
          
          // Apply mode based on selection
          const currentPage = figma.currentPage;
          const selection = figma.currentPage.selection;
          
          if (selection.length > 0) {
            // Apply to selected nodes
            for (const node of selection) {
              node.setExplicitVariableModeForCollection(collection.id, mode.id);
            }
            console.log(`Applied "${selectedMode}" mode to ${selection.length} selected node(s) from collection "${themeCollectionName}"`);
          } else {
            // Apply to page level only
            currentPage.setExplicitVariableModeForCollection(collection.id, mode.id);
            console.log(`Applied "${selectedMode}" mode to page from collection "${themeCollectionName}"`);
          }
          appliedCollections.push(themeCollectionName);
          applied = true;
          break; // Found and applied, exit loop
          
        } catch (error) {
          console.log(`Error applying mode from "${themeCollectionName}": ${error.message}`);
        }
      }
      
      // Apply cascading theme modes based on source collection
      if (applied && sourceCollection) {
        await applyCascadingModes(sourceCollection, selectedMode);
      }
      
      if (applied) {
        const selection = figma.currentPage.selection;
        const target = selection.length > 0 ? `${selection.length} selected node(s)` : 'page';
        figma.notify(`✅ Applied "${selectedMode}" mode to ${target}`);
        figma.ui.postMessage({
          type: 'success',
          message: '' // Empty message since we're using figma.notify instead
        });
      } else {
        figma.notify(`❌ Mode "${selectedMode}" not found in theme collections`, { error: true });
        figma.ui.postMessage({
          type: 'error',
          message: `Mode "${selectedMode}" not found in any theme collections`
        });
      }
      
    } catch (error) {
      figma.notify(`❌ Error: ${error.message}`, { error: true });
      figma.ui.postMessage({
        type: 'error',
        message: `Error: ${error.message}`
      });
      console.error("Error applying mode:", error);
    }
  }
  
  if (msg.type === 'reset-variable-modes') {
    try {
      const currentPage = figma.currentPage;
      const selection = figma.currentPage.selection;
      
      console.log("Starting clean operation...");
      console.log("Selection count:", selection.length);
      
      let clearedCount = 0;
      
      if (selection.length > 0) {
        // Reset modes on selected nodes to default
        console.log("Resetting selected nodes to default modes...");
        for (const node of selection) {
          console.log(`Processing node: ${node.name}`);
          
          // Check if node has explicitVariableModes property
          if (node.explicitVariableModes) {
            console.log(`Node ${node.name} has explicit modes:`, node.explicitVariableModes);
            
            // Loop through all explicit variable modes on this node
            for (const collectionId in node.explicitVariableModes) {
              try {
                console.log(`Resetting collection ID: ${collectionId}`);
                
                // Get the collection to find the default mode
                const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
                if (collection && collection.modes.length > 0) {
                  // Set to the first (default) mode
                  node.setExplicitVariableModeForCollection(collection, collection.modes[0].modeId);
                  clearedCount++;
                  console.log(`Reset collection ${collection.name} to default mode for ${node.name}`);
                } else {
                  console.log(`Could not get collection for ID: ${collectionId}`);
                }
              } catch (error) {
                console.log(`Failed to reset collection ${collectionId} for ${node.name}: ${error.message}`);
              }
            }
          } else {
            console.log(`Node ${node.name} has no explicit variable modes`);
          }
        }
        
        figma.notify(`✅ Reset ${clearedCount} variable modes to default for ${selection.length} selected node(s)`);
      } else {
        // Reset modes on page level to default
        console.log("Resetting page level modes to default...");
        
        // Work with the theme collections we know about
        const themeCollectionNames = ['🌈 Theme', '🌈 Theme 2', '🌈 Theme 3', '🌈 Theme 4'];
        
        for (const themeCollectionName of themeCollectionNames) {
          try {
            const themeCollection = collectionsData.find(c => c.name === themeCollectionName);
            if (!themeCollection) continue;
            
            const collection = await figma.variables.getVariableCollectionByIdAsync(themeCollection.id);
            if (!collection || collection.modes.length === 0) continue;
            
            // Reset to the first (default) mode
            currentPage.setExplicitVariableModeForCollection(collection, collection.modes[0].modeId);
            clearedCount++;
            console.log(`Reset ${themeCollectionName} to default mode for page`);
          } catch (error) {
            console.log(`Failed to reset ${themeCollectionName} for page: ${error.message}`);
          }
        }
        
        figma.notify(`✅ Reset ${clearedCount} variable modes to default for page`);
      }
      
      console.log(`Total reset to default: ${clearedCount}`);
      
      figma.ui.postMessage({
        type: 'success',
        message: ''
      });
      
    } catch (error) {
      console.log("Clean operation error:", error);
      figma.notify(`❌ Error resetting modes: ${error.message}`, { error: true });
      figma.ui.postMessage({
        type: 'error',
        message: `Error: ${error.message}`
      });
      console.error("Error resetting modes:", error);
    }
  }
};

// Function to apply cascading theme modes
async function applyCascadingModes(sourceCollection, selectedMode) {
  try {
    console.log(`Applying cascading modes from source: "${sourceCollection}"`);
    
    const currentPage = figma.currentPage;
    
    if (sourceCollection === '🌈 Theme 2') {
      // Set 🌈 Theme to "Theme 2"
      await setThemeMode('🌈 Theme', 'Theme 2');
      console.log('Applied cascading: 🌈 Theme → Theme 2');
      
    } else if (sourceCollection === '🌈 Theme 3') {
      // Set 🌈 Theme to "Theme 2" and 🌈 Theme 2 to "Theme 3"
      await setThemeMode('🌈 Theme', 'Theme 2');
      await setThemeMode('🌈 Theme 2', 'Theme 3');
      console.log('Applied cascading: 🌈 Theme → Theme 2, 🌈 Theme 2 → Theme 3');
      
    } else if (sourceCollection === '🌈 Theme 4') {
      // Set 🌈 Theme to "Theme 2", 🌈 Theme 2 to "Theme 3", and 🌈 Theme 3 to "Theme 4"
      await setThemeMode('🌈 Theme', 'Theme 2');
      await setThemeMode('🌈 Theme 2', 'Theme 3');
      await setThemeMode('🌈 Theme 3', 'Theme 4');
      console.log('Applied cascading: 🌈 Theme → Theme 2, 🌈 Theme 2 → Theme 3, 🌈 Theme 3 → Theme 4');
    }
    
  } catch (error) {
    console.log(`Error in cascading modes: ${error.message}`);
  }
}

// Helper function to set a specific theme mode
async function setThemeMode(collectionName, modeName) {
  try {
    // Find the collection in our loaded data
    const themeCollection = collectionsData.find(c => c.name === collectionName);
    
    if (!themeCollection) {
      console.log(`Collection "${collectionName}" not found for cascading`);
      return;
    }
    
    // Find the mode in this collection
    const mode = themeCollection.modes.find(m => m.name === modeName);
    
    if (!mode) {
      console.log(`Mode "${modeName}" not found in collection "${collectionName}" for cascading`);
      return;
    }
    
    // Get the actual collection object
    const collection = await figma.variables.getVariableCollectionByIdAsync(themeCollection.id);
    
    if (!collection) {
      console.log(`Could not get collection object for "${collectionName}" for cascading`);
      return;
    }
    
    // Apply mode based on selection (same logic as main apply)
    const currentPage = figma.currentPage;
    const selection = figma.currentPage.selection;
    
    if (selection.length > 0) {
      // Apply to selected nodes
      for (const node of selection) {
        node.setExplicitVariableModeForCollection(collection.id, mode.id);
      }
    } else {
      // Apply to page level
      currentPage.setExplicitVariableModeForCollection(collection.id, mode.id);
    }
    
    console.log(`Cascading: Applied "${modeName}" mode to "${collectionName}"`);
    
  } catch (error) {
    console.log(`Error setting cascading mode for "${collectionName}": ${error.message}`);
  }
}

// Load collections data on plugin start
(async function() {
  try {
    console.log("Loading global library collections...");
    
    // ONLY get global library collections
    const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    console.log(`Found ${libraryCollections.length} global library collections`);
    
    collectionsData = [];
    
    // Process each library collection quickly (no timeout, just try them all)
    for (const libraryCollection of libraryCollections) {
      try {
        console.log(`Processing: "${libraryCollection.name}"`);
        
        // Get variables from library collection
        const variables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(libraryCollection.key);
        
        if (variables.length === 0) {
          console.log(`No variables in "${libraryCollection.name}"`);
          continue;
        }
        
        // Import one variable to get access to collection modes
        const importedVariable = await figma.variables.importVariableByKeyAsync(variables[0].key);
        const collection = await figma.variables.getVariableCollectionByIdAsync(importedVariable.variableCollectionId);
        
        if (!collection || !collection.modes || collection.modes.length === 0) {
          console.log(`No modes in "${libraryCollection.name}"`);
          continue;
        }
        
        collectionsData.push({
          id: collection.id,
          name: collection.name,
          libraryName: libraryCollection.libraryName,
          isRemote: true,
          modes: collection.modes.map(mode => ({
            id: mode.modeId,
            name: mode.name
          }))
        });
        
        console.log(`Added: "${collection.name}" with ${collection.modes.length} modes`);
        
      } catch (error) {
        console.log(`Failed "${libraryCollection.name}": ${error.message}`);
        continue;
      }
    }
    
    // Send ONLY global collections to UI
    figma.ui.postMessage({
      type: 'collections-loaded', 
      data: collectionsData
    });
    
    figma.notify(`Found ${collectionsData.length} variable collections`);
    console.log(`Loaded ${collectionsData.length} global collections`);
    
  } catch (error) {
    console.error("Error:", error);
    figma.ui.postMessage({
      type: 'collections-loaded', 
      data: []
    });
  }
})();