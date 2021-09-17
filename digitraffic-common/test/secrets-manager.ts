const AWS = require('aws-sdk');
import * as sinon from "sinon";

const secretValue = sinon.stub();

export function stubSecretsManager() {
    const smStub = {
        getSecretValue: secretValue
    };

    sinon.stub(AWS, 'SecretsManager').returns(smStub);
}

export function mockSecret(secret: any) {
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
