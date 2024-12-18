// Azure authentication dependency
import { DefaultAzureCredential } from "@azure/identity";

// Azure resource management dependency
import { SubscriptionClient } from "@azure/arm-subscriptions";

// Acquire credential
const tokenCredential = new DefaultAzureCredential();

console.log(tokenCredential);

async function listSubscriptions() {
  try {
    // use credential to authenticate with Azure SDKs
    const client = new SubscriptionClient(tokenCredential);

    // get details of each subscription
    for await (const item of client.subscriptions.list()) {
      const subscriptionDetails = await client.subscriptions.get(
        item.subscriptionId
      );
      /* 
        Each item looks like:
      
        {
          id: '/subscriptions/aaaa0a0a-bb1b-cc2c-dd3d-eeeeee4e4e4e',
          subscriptionId: 'aaaa0a0a-bb1b-cc2c-dd3d-eeeeee4e4e4e',
          displayName: 'YOUR-SUBSCRIPTION-NAME',
          state: 'Enabled',
          subscriptionPolicies: {
            locationPlacementId: 'Internal_2014-09-01',
            quotaId: 'Internal_2014-09-01',
            spendingLimit: 'Off'
          },
          authorizationSource: 'RoleBased'
        },
    */
      console.log(subscriptionDetails);
    }
  } catch (err) {
    console.error(JSON.stringify(err));
  }
}

listSubscriptions()
  .then(() => {
    console.log("done");
  })
  .catch((ex) => {
    console.log(ex);
  });
