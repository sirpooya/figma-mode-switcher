/******/ (() => { // webpackBootstrap
/*!*********************!*\
  !*** ./src/code.js ***!
  \*********************/
// Show the plugin UI with increased height to accommodate dropdown
figma.showUI(__html__, { width: 400, height: 300 });

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
          
          // Apply mode to page level only
          const currentPage = figma.currentPage;
          currentPage.setExplicitVariableModeForCollection(collection.id, mode.id);
          
          console.log(`Applied "${selectedMode}" mode to page from collection "${themeCollectionName}"`);
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
        figma.notify(`✅ Applied "${selectedMode}" mode to page`);
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
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
  
  if (msg.type === 'config-error') {
    figma.notify(`❌ ${msg.message}`, { error: true });
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
    
    // Apply mode to page level
    const currentPage = figma.currentPage;
    currentPage.setExplicitVariableModeForCollection(collection.id, mode.id);
    
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
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUF3QjtBQUNsRDtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLENBQUMsSSIsInNvdXJjZXMiOlsid2VicGFjazovL2ZpZ21hLW1vZGUtc3dpdGNoZXIvLi9zcmMvY29kZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTaG93IHRoZSBwbHVnaW4gVUkgd2l0aCBpbmNyZWFzZWQgaGVpZ2h0IHRvIGFjY29tbW9kYXRlIGRyb3Bkb3duXG5maWdtYS5zaG93VUkoX19odG1sX18sIHsgd2lkdGg6IDQwMCwgaGVpZ2h0OiAzMDAgfSk7XG5cbmxldCBjb2xsZWN0aW9uc0RhdGEgPSBbXTtcblxuLy8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gdGhlIFVJXG5maWdtYS51aS5vbm1lc3NhZ2UgPSBhc3luYyAobXNnKSA9PiB7XG4gIGlmIChtc2cudHlwZSA9PT0gJ2FwcGx5LXRoZW1lLW1vZGUnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgc2VsZWN0ZWRNb2RlIH0gPSBtc2cuZGF0YTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYExvb2tpbmcgZm9yIG1vZGUgXCIke3NlbGVjdGVkTW9kZX1cIiBpbiB0aGVtZSBjb2xsZWN0aW9uc2ApO1xuICAgICAgXG4gICAgICAvLyBGaW5kIHRoZW1lIGNvbGxlY3Rpb25zICjwn4yIIFRoZW1lLCDwn4yIIFRoZW1lIDIsIPCfjIggVGhlbWUgMywg8J+MiCBUaGVtZSA0KVxuICAgICAgY29uc3QgdGhlbWVDb2xsZWN0aW9uTmFtZXMgPSBbJ/CfjIggVGhlbWUnLCAn8J+MiCBUaGVtZSAyJywgJ/CfjIggVGhlbWUgMycsICfwn4yIIFRoZW1lIDQnXTtcbiAgICAgIFxuICAgICAgbGV0IGFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGxldCBhcHBsaWVkQ29sbGVjdGlvbnMgPSBbXTtcbiAgICAgIGxldCBzb3VyY2VDb2xsZWN0aW9uID0gbnVsbDtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCB0aGVtZUNvbGxlY3Rpb25OYW1lIG9mIHRoZW1lQ29sbGVjdGlvbk5hbWVzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gRmluZCB0aGUgY29sbGVjdGlvbiBpbiBvdXIgbG9hZGVkIGRhdGFcbiAgICAgICAgICBjb25zdCB0aGVtZUNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc0RhdGEuZmluZChjID0+IGMubmFtZSA9PT0gdGhlbWVDb2xsZWN0aW9uTmFtZSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCF0aGVtZUNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDb2xsZWN0aW9uIFwiJHt0aGVtZUNvbGxlY3Rpb25OYW1lfVwiIG5vdCBmb3VuZCBpbiBsb2FkZWQgY29sbGVjdGlvbnNgKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyBGaW5kIHRoZSBtb2RlIGluIHRoaXMgY29sbGVjdGlvblxuICAgICAgICAgIGNvbnN0IG1vZGUgPSB0aGVtZUNvbGxlY3Rpb24ubW9kZXMuZmluZChtID0+IG0ubmFtZSA9PT0gc2VsZWN0ZWRNb2RlKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoIW1vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBNb2RlIFwiJHtzZWxlY3RlZE1vZGV9XCIgbm90IGZvdW5kIGluIGNvbGxlY3Rpb24gXCIke3RoZW1lQ29sbGVjdGlvbk5hbWV9XCJgKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBjb25zb2xlLmxvZyhgRm91bmQgbW9kZSBcIiR7c2VsZWN0ZWRNb2RlfVwiIGluIGNvbGxlY3Rpb24gXCIke3RoZW1lQ29sbGVjdGlvbk5hbWV9XCJgKTtcbiAgICAgICAgICBzb3VyY2VDb2xsZWN0aW9uID0gdGhlbWVDb2xsZWN0aW9uTmFtZTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBHZXQgdGhlIGFjdHVhbCBjb2xsZWN0aW9uIG9iamVjdFxuICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0VmFyaWFibGVDb2xsZWN0aW9uQnlJZEFzeW5jKHRoZW1lQ29sbGVjdGlvbi5pZCk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQ291bGQgbm90IGdldCBjb2xsZWN0aW9uIG9iamVjdCBmb3IgXCIke3RoZW1lQ29sbGVjdGlvbk5hbWV9XCJgKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyBBcHBseSBtb2RlIHRvIHBhZ2UgbGV2ZWwgb25seVxuICAgICAgICAgIGNvbnN0IGN1cnJlbnRQYWdlID0gZmlnbWEuY3VycmVudFBhZ2U7XG4gICAgICAgICAgY3VycmVudFBhZ2Uuc2V0RXhwbGljaXRWYXJpYWJsZU1vZGVGb3JDb2xsZWN0aW9uKGNvbGxlY3Rpb24uaWQsIG1vZGUuaWQpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnNvbGUubG9nKGBBcHBsaWVkIFwiJHtzZWxlY3RlZE1vZGV9XCIgbW9kZSB0byBwYWdlIGZyb20gY29sbGVjdGlvbiBcIiR7dGhlbWVDb2xsZWN0aW9uTmFtZX1cImApO1xuICAgICAgICAgIGFwcGxpZWRDb2xsZWN0aW9ucy5wdXNoKHRoZW1lQ29sbGVjdGlvbk5hbWUpO1xuICAgICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrOyAvLyBGb3VuZCBhbmQgYXBwbGllZCwgZXhpdCBsb29wXG4gICAgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYEVycm9yIGFwcGx5aW5nIG1vZGUgZnJvbSBcIiR7dGhlbWVDb2xsZWN0aW9uTmFtZX1cIjogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIEFwcGx5IGNhc2NhZGluZyB0aGVtZSBtb2RlcyBiYXNlZCBvbiBzb3VyY2UgY29sbGVjdGlvblxuICAgICAgaWYgKGFwcGxpZWQgJiYgc291cmNlQ29sbGVjdGlvbikge1xuICAgICAgICBhd2FpdCBhcHBseUNhc2NhZGluZ01vZGVzKHNvdXJjZUNvbGxlY3Rpb24sIHNlbGVjdGVkTW9kZSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChhcHBsaWVkKSB7XG4gICAgICAgIGZpZ21hLm5vdGlmeShg4pyFIEFwcGxpZWQgXCIke3NlbGVjdGVkTW9kZX1cIiBtb2RlIHRvIHBhZ2VgKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgICAgICBtZXNzYWdlOiAnJyAvLyBFbXB0eSBtZXNzYWdlIHNpbmNlIHdlJ3JlIHVzaW5nIGZpZ21hLm5vdGlmeSBpbnN0ZWFkXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmlnbWEubm90aWZ5KGDinYwgTW9kZSBcIiR7c2VsZWN0ZWRNb2RlfVwiIG5vdCBmb3VuZCBpbiB0aGVtZSBjb2xsZWN0aW9uc2AsIHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6IGBNb2RlIFwiJHtzZWxlY3RlZE1vZGV9XCIgbm90IGZvdW5kIGluIGFueSB0aGVtZSBjb2xsZWN0aW9uc2BcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgZmlnbWEubm90aWZ5KGDinYwgRXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1gLCB7IGVycm9yOiB0cnVlIH0pO1xuICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICBtZXNzYWdlOiBgRXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBhcHBseWluZyBtb2RlOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG4gIFxuICBpZiAobXNnLnR5cGUgPT09ICdjYW5jZWwnKSB7XG4gICAgZmlnbWEuY2xvc2VQbHVnaW4oKTtcbiAgfVxuICBcbiAgaWYgKG1zZy50eXBlID09PSAnY29uZmlnLWVycm9yJykge1xuICAgIGZpZ21hLm5vdGlmeShg4p2MICR7bXNnLm1lc3NhZ2V9YCwgeyBlcnJvcjogdHJ1ZSB9KTtcbiAgfVxufTtcblxuLy8gRnVuY3Rpb24gdG8gYXBwbHkgY2FzY2FkaW5nIHRoZW1lIG1vZGVzXG5hc3luYyBmdW5jdGlvbiBhcHBseUNhc2NhZGluZ01vZGVzKHNvdXJjZUNvbGxlY3Rpb24sIHNlbGVjdGVkTW9kZSkge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGBBcHBseWluZyBjYXNjYWRpbmcgbW9kZXMgZnJvbSBzb3VyY2U6IFwiJHtzb3VyY2VDb2xsZWN0aW9ufVwiYCk7XG4gICAgXG4gICAgY29uc3QgY3VycmVudFBhZ2UgPSBmaWdtYS5jdXJyZW50UGFnZTtcbiAgICBcbiAgICBpZiAoc291cmNlQ29sbGVjdGlvbiA9PT0gJ/CfjIggVGhlbWUgMicpIHtcbiAgICAgIC8vIFNldCDwn4yIIFRoZW1lIHRvIFwiVGhlbWUgMlwiXG4gICAgICBhd2FpdCBzZXRUaGVtZU1vZGUoJ/CfjIggVGhlbWUnLCAnVGhlbWUgMicpO1xuICAgICAgY29uc29sZS5sb2coJ0FwcGxpZWQgY2FzY2FkaW5nOiDwn4yIIFRoZW1lIOKGkiBUaGVtZSAyJyk7XG4gICAgICBcbiAgICB9IGVsc2UgaWYgKHNvdXJjZUNvbGxlY3Rpb24gPT09ICfwn4yIIFRoZW1lIDMnKSB7XG4gICAgICAvLyBTZXQg8J+MiCBUaGVtZSB0byBcIlRoZW1lIDJcIiBhbmQg8J+MiCBUaGVtZSAyIHRvIFwiVGhlbWUgM1wiXG4gICAgICBhd2FpdCBzZXRUaGVtZU1vZGUoJ/CfjIggVGhlbWUnLCAnVGhlbWUgMicpO1xuICAgICAgYXdhaXQgc2V0VGhlbWVNb2RlKCfwn4yIIFRoZW1lIDInLCAnVGhlbWUgMycpO1xuICAgICAgY29uc29sZS5sb2coJ0FwcGxpZWQgY2FzY2FkaW5nOiDwn4yIIFRoZW1lIOKGkiBUaGVtZSAyLCDwn4yIIFRoZW1lIDIg4oaSIFRoZW1lIDMnKTtcbiAgICAgIFxuICAgIH0gZWxzZSBpZiAoc291cmNlQ29sbGVjdGlvbiA9PT0gJ/CfjIggVGhlbWUgNCcpIHtcbiAgICAgIC8vIFNldCDwn4yIIFRoZW1lIHRvIFwiVGhlbWUgMlwiLCDwn4yIIFRoZW1lIDIgdG8gXCJUaGVtZSAzXCIsIGFuZCDwn4yIIFRoZW1lIDMgdG8gXCJUaGVtZSA0XCJcbiAgICAgIGF3YWl0IHNldFRoZW1lTW9kZSgn8J+MiCBUaGVtZScsICdUaGVtZSAyJyk7XG4gICAgICBhd2FpdCBzZXRUaGVtZU1vZGUoJ/CfjIggVGhlbWUgMicsICdUaGVtZSAzJyk7XG4gICAgICBhd2FpdCBzZXRUaGVtZU1vZGUoJ/CfjIggVGhlbWUgMycsICdUaGVtZSA0Jyk7XG4gICAgICBjb25zb2xlLmxvZygnQXBwbGllZCBjYXNjYWRpbmc6IPCfjIggVGhlbWUg4oaSIFRoZW1lIDIsIPCfjIggVGhlbWUgMiDihpIgVGhlbWUgMywg8J+MiCBUaGVtZSAzIOKGkiBUaGVtZSA0Jyk7XG4gICAgfVxuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKGBFcnJvciBpbiBjYXNjYWRpbmcgbW9kZXM6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgfVxufVxuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gc2V0IGEgc3BlY2lmaWMgdGhlbWUgbW9kZVxuYXN5bmMgZnVuY3Rpb24gc2V0VGhlbWVNb2RlKGNvbGxlY3Rpb25OYW1lLCBtb2RlTmFtZSkge1xuICB0cnkge1xuICAgIC8vIEZpbmQgdGhlIGNvbGxlY3Rpb24gaW4gb3VyIGxvYWRlZCBkYXRhXG4gICAgY29uc3QgdGhlbWVDb2xsZWN0aW9uID0gY29sbGVjdGlvbnNEYXRhLmZpbmQoYyA9PiBjLm5hbWUgPT09IGNvbGxlY3Rpb25OYW1lKTtcbiAgICBcbiAgICBpZiAoIXRoZW1lQ29sbGVjdGlvbikge1xuICAgICAgY29uc29sZS5sb2coYENvbGxlY3Rpb24gXCIke2NvbGxlY3Rpb25OYW1lfVwiIG5vdCBmb3VuZCBmb3IgY2FzY2FkaW5nYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIEZpbmQgdGhlIG1vZGUgaW4gdGhpcyBjb2xsZWN0aW9uXG4gICAgY29uc3QgbW9kZSA9IHRoZW1lQ29sbGVjdGlvbi5tb2Rlcy5maW5kKG0gPT4gbS5uYW1lID09PSBtb2RlTmFtZSk7XG4gICAgXG4gICAgaWYgKCFtb2RlKSB7XG4gICAgICBjb25zb2xlLmxvZyhgTW9kZSBcIiR7bW9kZU5hbWV9XCIgbm90IGZvdW5kIGluIGNvbGxlY3Rpb24gXCIke2NvbGxlY3Rpb25OYW1lfVwiIGZvciBjYXNjYWRpbmdgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgLy8gR2V0IHRoZSBhY3R1YWwgY29sbGVjdGlvbiBvYmplY3RcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldFZhcmlhYmxlQ29sbGVjdGlvbkJ5SWRBc3luYyh0aGVtZUNvbGxlY3Rpb24uaWQpO1xuICAgIFxuICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgY29uc29sZS5sb2coYENvdWxkIG5vdCBnZXQgY29sbGVjdGlvbiBvYmplY3QgZm9yIFwiJHtjb2xsZWN0aW9uTmFtZX1cIiBmb3IgY2FzY2FkaW5nYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIEFwcGx5IG1vZGUgdG8gcGFnZSBsZXZlbFxuICAgIGNvbnN0IGN1cnJlbnRQYWdlID0gZmlnbWEuY3VycmVudFBhZ2U7XG4gICAgY3VycmVudFBhZ2Uuc2V0RXhwbGljaXRWYXJpYWJsZU1vZGVGb3JDb2xsZWN0aW9uKGNvbGxlY3Rpb24uaWQsIG1vZGUuaWQpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGBDYXNjYWRpbmc6IEFwcGxpZWQgXCIke21vZGVOYW1lfVwiIG1vZGUgdG8gXCIke2NvbGxlY3Rpb25OYW1lfVwiYCk7XG4gICAgXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5sb2coYEVycm9yIHNldHRpbmcgY2FzY2FkaW5nIG1vZGUgZm9yIFwiJHtjb2xsZWN0aW9uTmFtZX1cIjogJHtlcnJvci5tZXNzYWdlfWApO1xuICB9XG59XG5cbi8vIExvYWQgY29sbGVjdGlvbnMgZGF0YSBvbiBwbHVnaW4gc3RhcnRcbihhc3luYyBmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgZ2xvYmFsIGxpYnJhcnkgY29sbGVjdGlvbnMuLi5cIik7XG4gICAgXG4gICAgLy8gT05MWSBnZXQgZ2xvYmFsIGxpYnJhcnkgY29sbGVjdGlvbnNcbiAgICBjb25zdCBsaWJyYXJ5Q29sbGVjdGlvbnMgPSBhd2FpdCBmaWdtYS50ZWFtTGlicmFyeS5nZXRBdmFpbGFibGVMaWJyYXJ5VmFyaWFibGVDb2xsZWN0aW9uc0FzeW5jKCk7XG4gICAgY29uc29sZS5sb2coYEZvdW5kICR7bGlicmFyeUNvbGxlY3Rpb25zLmxlbmd0aH0gZ2xvYmFsIGxpYnJhcnkgY29sbGVjdGlvbnNgKTtcbiAgICBcbiAgICBjb2xsZWN0aW9uc0RhdGEgPSBbXTtcbiAgICBcbiAgICAvLyBQcm9jZXNzIGVhY2ggbGlicmFyeSBjb2xsZWN0aW9uIHF1aWNrbHkgKG5vIHRpbWVvdXQsIGp1c3QgdHJ5IHRoZW0gYWxsKVxuICAgIGZvciAoY29uc3QgbGlicmFyeUNvbGxlY3Rpb24gb2YgbGlicmFyeUNvbGxlY3Rpb25zKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZzogXCIke2xpYnJhcnlDb2xsZWN0aW9uLm5hbWV9XCJgKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEdldCB2YXJpYWJsZXMgZnJvbSBsaWJyYXJ5IGNvbGxlY3Rpb25cbiAgICAgICAgY29uc3QgdmFyaWFibGVzID0gYXdhaXQgZmlnbWEudGVhbUxpYnJhcnkuZ2V0VmFyaWFibGVzSW5MaWJyYXJ5Q29sbGVjdGlvbkFzeW5jKGxpYnJhcnlDb2xsZWN0aW9uLmtleSk7XG4gICAgICAgIFxuICAgICAgICBpZiAodmFyaWFibGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBObyB2YXJpYWJsZXMgaW4gXCIke2xpYnJhcnlDb2xsZWN0aW9uLm5hbWV9XCJgKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gSW1wb3J0IG9uZSB2YXJpYWJsZSB0byBnZXQgYWNjZXNzIHRvIGNvbGxlY3Rpb24gbW9kZXNcbiAgICAgICAgY29uc3QgaW1wb3J0ZWRWYXJpYWJsZSA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5pbXBvcnRWYXJpYWJsZUJ5S2V5QXN5bmModmFyaWFibGVzWzBdLmtleSk7XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0VmFyaWFibGVDb2xsZWN0aW9uQnlJZEFzeW5jKGltcG9ydGVkVmFyaWFibGUudmFyaWFibGVDb2xsZWN0aW9uSWQpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFjb2xsZWN0aW9uIHx8ICFjb2xsZWN0aW9uLm1vZGVzIHx8IGNvbGxlY3Rpb24ubW9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYE5vIG1vZGVzIGluIFwiJHtsaWJyYXJ5Q29sbGVjdGlvbi5uYW1lfVwiYCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbGxlY3Rpb25zRGF0YS5wdXNoKHtcbiAgICAgICAgICBpZDogY29sbGVjdGlvbi5pZCxcbiAgICAgICAgICBuYW1lOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgbGlicmFyeU5hbWU6IGxpYnJhcnlDb2xsZWN0aW9uLmxpYnJhcnlOYW1lLFxuICAgICAgICAgIGlzUmVtb3RlOiB0cnVlLFxuICAgICAgICAgIG1vZGVzOiBjb2xsZWN0aW9uLm1vZGVzLm1hcChtb2RlID0+ICh7XG4gICAgICAgICAgICBpZDogbW9kZS5tb2RlSWQsXG4gICAgICAgICAgICBuYW1lOiBtb2RlLm5hbWVcbiAgICAgICAgICB9KSlcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhgQWRkZWQ6IFwiJHtjb2xsZWN0aW9uLm5hbWV9XCIgd2l0aCAke2NvbGxlY3Rpb24ubW9kZXMubGVuZ3RofSBtb2Rlc2ApO1xuICAgICAgICBcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBGYWlsZWQgXCIke2xpYnJhcnlDb2xsZWN0aW9uLm5hbWV9XCI6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIFNlbmQgT05MWSBnbG9iYWwgY29sbGVjdGlvbnMgdG8gVUlcbiAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICB0eXBlOiAnY29sbGVjdGlvbnMtbG9hZGVkJywgXG4gICAgICBkYXRhOiBjb2xsZWN0aW9uc0RhdGFcbiAgICB9KTtcbiAgICBcbiAgICBmaWdtYS5ub3RpZnkoYEZvdW5kICR7Y29sbGVjdGlvbnNEYXRhLmxlbmd0aH0gdmFyaWFibGUgY29sbGVjdGlvbnNgKTtcbiAgICBjb25zb2xlLmxvZyhgTG9hZGVkICR7Y29sbGVjdGlvbnNEYXRhLmxlbmd0aH0gZ2xvYmFsIGNvbGxlY3Rpb25zYCk7XG4gICAgXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yOlwiLCBlcnJvcik7XG4gICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgdHlwZTogJ2NvbGxlY3Rpb25zLWxvYWRlZCcsIFxuICAgICAgZGF0YTogW11cbiAgICB9KTtcbiAgfVxufSkoKTsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=