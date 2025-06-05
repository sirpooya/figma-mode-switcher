figma.showUI(__html__, { visible: false });

async function exportVariablesAsJSON() {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const result = {};

    for (const collection of collections) {
      const collectionName = collection.name;
      result[collectionName] = {};

      for (const mode of collection.modes) {
        const modeId = mode.modeId;
        const modeName = mode.name;
        result[collectionName][modeName] = {};

        const variables = [];
        for (const id of collection.variableIds) {
          const variable = figma.variables.getVariableById(id);
          if (variable) {
            variables.push(variable);
          }
        }

        for (const variable of variables) {
          const value = variable.valuesByMode[modeId];
          let serializedValue;

          if (variable.resolvedType === "COLOR") {
            const color = value;
            serializedValue = {
              r: Number(color.r.toFixed(3)),
              g: Number(color.g.toFixed(3)),
              b: Number(color.b.toFixed(3)),
              a: Number(color.a.toFixed(3)),
            };
          } else if (variable.resolvedType === "FLOAT") {
            serializedValue = Number(value.toFixed(3));
          } else {
            serializedValue = value;
          }

          result[collectionName][modeName][variable.name] = serializedValue;
        }
      }
    }

    function sortNestedKeys(obj, isRoot = true) {
      if (Array.isArray(obj)) {
        return obj.map(item => sortNestedKeys(item, false));
      } else if (obj !== null && typeof obj === 'object') {
        const keys = Object.keys(obj);
        const sortedKeys = isRoot ? keys : keys.sort((a, b) => {
          const parseKey = (key) => {
            const match = key.match(/^([^\d]*)(\d+)?$/);
            return {
              alpha: match && match[1] ? match[1] : '',
              num: match && match[2] ? parseInt(match[2], 10) : -1
            };
          };

          const aParts = parseKey(a);
          const bParts = parseKey(b);
          const alphaCompare = aParts.alpha.localeCompare(bParts.alpha, undefined, { sensitivity: 'base' });
          if (alphaCompare !== 0) return alphaCompare;
          return aParts.num - bParts.num;
        });

        const result = {};
        for (const key of sortedKeys) {
          result[key] = sortNestedKeys(obj[key], false);
        }
        return result;
      }
      return obj;
    }

    const sortedExport = sortNestedKeys(result);

    figma.ui.postMessage({
      type: 'export-ready',
      data: sortedExport,
      filename: 'exported_tokens.json'
    });
  } catch (error) {
    figma.notify(`❌ Error: ${error.message}`);
    console.error("Export error:", error);
    console.log("figma.getVariableById type:", typeof figma.getVariableById);
    console.log("figma.variables.getLocalVariableCollectionsAsync type:", typeof figma.variables.getLocalVariableCollectionsAsync);
    figma.closePlugin();
  }
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "close") {
    figma.closePlugin();
  }
};

exportVariablesAsJSON();