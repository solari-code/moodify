"use client"

import { Button } from "@/components/ui/button";

function handleSignIn() {
    console.log('SIGN IN')
}

export default function ButtonSignIn() {
    return (
        <Button onClick={handleSignIn}>Sign In</Button>
    )

}