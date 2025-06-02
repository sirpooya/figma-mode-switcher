// Run immediately without UI
(async function() {
  try {
    figma.notify("🚀 Starting theme mode application...");
    console.log("🚀 Starting theme mode application...");
    
    // Get all variable collections (including global/remote ones)
    const collections = await figma.variables.getVariableCollectionsAsync();
    figma.notify(`📁 Found ${collections.length} variable collections`);
    console.log(`📁 Found ${collections.length} variable collections:`, collections.map(c => `"${c.name}" (${c.remote ? 'REMOTE' : 'LOCAL'})`));
    
    // Find the "🌈 Theme" collection
    const themeCollection = collections.find(collection => 
      collection.name === "🌈 Theme"
    );
    
    if (!themeCollection) {
      const availableNames = collections.map(c => `"${c.name}"`).join(", ");
      figma.notify(`❌ Collection '🌈 Theme' not found. Available: ${availableNames}`, { error: true });
      console.error("❌ Collection '🌈 Theme' not found");
      console.log("Available collections:", collections.map(c => `"${c.name}" (${c.remote ? 'REMOTE' : 'LOCAL'})`));
      figma.closePlugin();
      return;
    }
    
    figma.notify(`✅ Found collection: "${themeCollection.name}" (${themeCollection.remote ? 'REMOTE' : 'LOCAL'})`);
    console.log(`✅ Found collection: "${themeCollection.name}" (${themeCollection.remote ? 'REMOTE' : 'LOCAL'})`);
    console.log(`🎨 Available modes:`, themeCollection.modes.map(m => `"${m.name}" (ID: ${m.modeId})`));
    
    // Find the "Plus" mode
    const plusMode = themeCollection.modes.find(mode => 
      mode.name === "Plus"
    );
    
    if (!plusMode) {
      const availableModes = themeCollection.modes.map(m => `"${m.name}"`).join(", ");
      figma.notify(`❌ Mode 'Plus' not found. Available modes: ${availableModes}`, { error: true });
      console.error("❌ Mode 'Plus' not found");
      console.log("Available modes:", themeCollection.modes.map(m => `"${m.name}"`));
      figma.closePlugin();
      return;
    }
    
    figma.notify(`✅ Found mode: "${plusMode.name}"`);
    console.log(`✅ Found mode: "${plusMode.name}" (ID: ${plusMode.modeId})`);
    
    // Get the current page
    const currentPage = figma.currentPage;
    figma.notify(`📄 Processing page: "${currentPage.name}" with ${currentPage.children.length} elements`);
    console.log(`📄 Working on page: "${currentPage.name}"`);
    console.log(`📊 Page has ${currentPage.children.length} top-level elements`);
    
    let processedNodes = 0;
    let skippedNodes = 0;
    let errorNodes = 0;
    
    // Function to recursively process all nodes
    function processNode(node, depth = 0) {
      const indent = "  ".repeat(depth);
      console.log(`${indent}🔍 Processing: "${node.name}" (${node.type})`);
      
      try {
        // Try to set the variable mode
        if (typeof node.setExplicitVariableModeForCollection === 'function') {
          node.setExplicitVariableModeForCollection(themeCollection.id, plusMode.modeId);
          console.log(`${indent}✅ Applied mode to: "${node.name}"`);
          processedNodes++;
        } else {
          console.log(`${indent}⚠️  Node "${node.name}" doesn't support setExplicitVariableModeForCollection`);
          skippedNodes++;
        }
      } catch (error) {
        console.log(`${indent}❌ Failed to apply mode to "${node.name}": ${error.message}`);
        errorNodes++;
      }
      
      // Process children
      if ('children' in node && node.children.length > 0) {
        console.log(`${indent}👶 Processing ${node.children.length} children of "${node.name}"`);
        node.children.forEach(child => processNode(child, depth + 1));
      }
    }
    
    // Process all nodes on the page
    figma.notify("🔄 Processing all nodes...");
    console.log("🔄 Starting to process all nodes...");
    currentPage.children.forEach(node => processNode(node));
    
    // Try to set page-level mode
    figma.notify("📄 Setting page-level mode...");
    console.log("📄 Attempting to set page-level variable mode...");
    try {
      if (typeof currentPage.setExplicitVariableModeForCollection === 'function') {
        currentPage.setExplicitVariableModeForCollection(themeCollection.id, plusMode.modeId);
        figma.notify("✅ Page-level mode set successfully");
        console.log("✅ Successfully set page-level variable mode");
      } else {
        figma.notify("⚠️ Page doesn't support mode setting");
        console.log("⚠️  Page doesn't support setExplicitVariableModeForCollection");
      }
    } catch (pageError) {
      figma.notify(`❌ Page-level mode failed: ${pageError.message}`, { error: true });
      console.log(`❌ Failed to set page-level mode: ${pageError.message}`);
    }
    
    // Summary
    const summaryMessage = `✅ Processed: ${processedNodes}, ⚠️ Skipped: ${skippedNodes}, ❌ Errors: ${errorNodes}`;
    figma.notify(summaryMessage);
    console.log("\n📊 SUMMARY:");
    console.log(`✅ Successfully processed: ${processedNodes} nodes`);
    console.log(`⚠️  Skipped: ${skippedNodes} nodes`);
    console.log(`❌ Errors: ${errorNodes} nodes`);
    
    // Check if any variables from this collection are actually used
    figma.notify("🔍 Checking variable usage...");
    console.log("\n🔍 Checking for variable usage...");
    const allVariables = await figma.variables.getVariablesAsync();
    const themeVariables = allVariables.filter(v => v.variableCollectionId === themeCollection.id);
    figma.notify(`📝 Found ${themeVariables.length} variables in collection`);
    console.log(`📝 Found ${themeVariables.length} variables in "🌈 Theme" collection`);
    themeVariables.forEach(variable => {
      console.log(`  - "${variable.name}" (ID: ${variable.id})`);
    });
    
    if (themeVariables.length === 0) {
      figma.notify("⚠️ No variables found in collection - this might be why nothing changed", { error: true });
      console.log("⚠️  No variables found in the collection - this might be why nothing changed");
    }
    
  } catch (error) {
    figma.notify(`💥 Fatal error: ${error.message}`, { error: true });
    console.error("💥 Fatal error:", error);
  }
  
  figma.notify("🏁 Plugin execution completed");
  console.log("🏁 Plugin execution completed");
  figma.closePlugin();
})();