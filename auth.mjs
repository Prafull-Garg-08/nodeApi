import {
  DefaultAzureCredential,
  EnvironmentCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
  AzurePowerShellCredential,
  AzureDeveloperCliCredential,
} from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-subscriptions";
import { createClientLogger } from "@azure/logger";

const logger = createClientLogger("azure:identity");

// Enable logging
logger.info("Starting credential tests...");

async function testCredential() {
  const credentials = [
    new EnvironmentCredential(),
    new ManagedIdentityCredential(),
    new AzureCliCredential(),
    new AzurePowerShellCredential(),
    new AzureDeveloperCliCredential(),
  ];

  for (const credential of credentials) {
    try {
      // Attempt to get a token for Azure Management scope
      const token = await credential.getToken(
        "https://management.azure.com/.default"
      );
      console.log(
        `${credential.constructor.name} succeeded with token:`,
        token.token
      );
      return credential.constructor.name; // Return the name of the successful credential
    } catch (err) {
      console.error(`${credential.constructor.name} failed:`, err.message);
    }
  }
  throw new Error("No credential was able to authenticate.");
}

async function listSubscriptions() {
  try {
    // Test which credential is used
    const activeCredential = await testCredential();
    console.log(`Active Credential: ${activeCredential}`);

    // Use DefaultAzureCredential to authenticate and list subscriptions
    const tokenCredential = new DefaultAzureCredential();
    const client = new SubscriptionClient(tokenCredential);

    console.log("Listing subscriptions...");
    for await (const item of client.subscriptions.list()) {
      const subscriptionDetails = await client.subscriptions.get(
        item.subscriptionId
      );
      console.log(subscriptionDetails);
    }
  } catch (err) {
    console.error("Error occurred:", JSON.stringify(err));
  }
}

// Run the program
listSubscriptions()
  .then(() => console.log("Done"))
  .catch((ex) => console.error("Unhandled exception:", ex));
