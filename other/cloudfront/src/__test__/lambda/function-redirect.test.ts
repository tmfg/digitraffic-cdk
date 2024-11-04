import { handler } from "../../lambda/function-redirect.js";

test("Function recognises correct url", () => {
    const reply = handler({
        request: {
            uri: "/anything"
        }
    });
    expect(reply.statusCode).toEqual(302);
    expect(reply.headers.location.value).toEqual("EXT_REDIRECT_URL");
});
export { };

