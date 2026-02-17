
const { Client, Storage, Permission, Role } = require('node-appwrite');

const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('uidlc-marketplace')
    .setKey('standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59');

const storage = new Storage(client);

async function fixStorage() {
    try {
        console.log('Updating "product-images" bucket permissions...');
        try {
            await storage.updateBucket(
                'product-images',
                'Product Images',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ],
                false, // fileSecurity (false = allow file level permissions to inherit or be overridden, checking docs.. actually false usually means bucket permissions apply? No, checking docs: fileSecurity: Enable file security. If enabled, users will be able to access files only if they have the specific file permission. If disabled, users will be able to access files if they have bucket permission.)
                // We want Disabled (false) so bucket permissions (Read Any) apply to all files.
                true, // enabled
                undefined, // max file size
                undefined, // allowed extensions
                undefined, // compression
                undefined, // encryption
                undefined // antivirus
            );
            console.log('Bucket permissions updated successfully.');
        } catch (e) {
            // If bucket doesn't exist, create it
            if (e.code === 404) {
                console.log('Bucket not found. Creating it...');
                await storage.createBucket(
                    'product-images',
                    'Product Images',
                    [
                        Permission.read(Role.any()),
                        Permission.create(Role.users()),
                        Permission.update(Role.users()),
                        Permission.delete(Role.users())
                    ],
                    false,
                    true
                );
                console.log('Bucket created successfully.');
            } else {
                throw e;
            }
        }
    } catch (error) {
        console.error('Error fixing storage:', error);
    }
}

fixStorage();
