import AWS = require('aws-sdk');
import * as sinon from "sinon";

const secretValue = sinon.stub();

/**
 * Stub Secrets Manager for tests.  You must call this
 * before you instantiate Secrets Manager(this might happen when you import the function that uses Secrets Manager).
 *
 * To mock the actual secret, call mockSecret()
 */
export function stubSecretsManager() {
    const smStub = {
        getSecretValue: secretValue
    };

    sinon.stub(AWS, 'SecretsManager').returns(smStub);
}

export function mockSecret<Secret>(secret: Secret) {
    if(!secret) {
        secretValue.returns({
           promise: sinon.stub().returns({})
        });
    } else {
        secretValue.returns({
            promise: sinon.stub().returns({
                SecretString: JSON.stringify(secret)
            })
        })
    }
}
