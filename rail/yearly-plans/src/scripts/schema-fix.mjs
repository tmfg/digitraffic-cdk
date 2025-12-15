import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const yamlPath = process.argv[2];
const outputPath = process.argv[3] || "src/model/schema.ts";

if (!yamlPath) {
  console.error(
    "Usage: node src/scripts/schema-fix.mjs <yaml-path> [output-path]",
  );
  process.exit(1);
}

// Step 1: Convert YAML to JSON Schema
console.log(`Converting ${yamlPath} to JSON Schema...`);
const jsonSchema = execSync(`npx yaml-to-json-schema@1.0.2 ${yamlPath}`, {
  encoding: "utf8",
});

// Step 2: Fix the missing slash in $ref paths
console.log("Fixing $ref paths...");
const schemaFixed = jsonSchema.replace(/#definitions\//g, "#/definitions/");

// Step 3: Remove wrapper object and redundant properties section
console.log("Removing wrapper object...");
const schemaObj = JSON.parse(schemaFixed);
const cleanedSchema = {
  definitions: schemaObj.definitions
};

// Step 4: Add null to all optional fields
console.log("Adding null to optional fields...");
for (const defName in cleanedSchema.definitions) {
  const definition = cleanedSchema.definitions[defName];
  if (definition.properties) {
    const requiredFields = new Set(definition.required || []);
    for (const propName in definition.properties) {
      if (!requiredFields.has(propName)) {
        const prop = definition.properties[propName];
        // If it has a $ref, wrap it in anyOf with null
        if (prop.$ref) {
          definition.properties[propName] = {
            anyOf: [{ $ref: prop.$ref }, { type: "null" }]
          };
        }
        // If it has a type (and it's not already an array), make it nullable
        else if (prop.type && !Array.isArray(prop.type)) {
          prop.type = [prop.type, "null"];
        }
      }
    }
  }
}

// Step 5: Convert to TypeScript module
const output = `export const schema = ${JSON.stringify(cleanedSchema, null, 2)};`;

writeFileSync(outputPath, output);

console.log(`✅ Schema converted and fixed: ${outputPath}`);
