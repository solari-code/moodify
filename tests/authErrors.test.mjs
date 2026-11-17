import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { AUTH_ERROR_KEYS, authErrorKey } from "../src/lib/authErrors.js"

describe("authErrorKey", () => {
    test("known Auth.js error types get their message", () => {
        assert.equal(authErrorKey("OAuthCallbackError"), "canceled")
        assert.equal(authErrorKey("AccessDenied"), "canceled")
        assert.equal(authErrorKey("OAuthAccountNotLinked"), "accountNotLinked")
        assert.equal(authErrorKey("Configuration"), "configuration")
    })

    test("everything else gets the general message", () => {
        for (const type of ["CredentialsSignin", "Verification", "undefined", "", "toString", "__proto__", undefined, ["AccessDenied"]]) {
            assert.equal(authErrorKey(type), "default", String(type))
        }
    })

    test("lists every message key once", () => {
        assert.deepEqual(AUTH_ERROR_KEYS, ["canceled", "accountNotLinked", "configuration", "default"])
    })
})
