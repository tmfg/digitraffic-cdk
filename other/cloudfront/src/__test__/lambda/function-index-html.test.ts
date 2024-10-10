import { handler } from "../../lambda/function-index-html.js";

test("without /", () => {
    const request = handler({
        request: {
            uri: "/test"
        }
    });
    expect(request.uri).toEqual("/test");
});

test("with /", () => {
    const request = handler({
        request: {
            uri: "/test/"
        }
    });
    expect(request.uri).toEqual("/test/index.html");
});