import Link from "next/link"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import MobileNav from "./MobileNav";
import { Smile } from "lucide-react"
import ButtonSignIn from "./ButtonSignIn";
import logo from '@/img/moodify_logo.png'

import { auth } from "@/../auth";


export default async function Nav() {

    const session = await auth()

    console.log(session)

    // const session = {
    //     email: "dom@moodify.com",
    //     name: "Dominik Gilg",
    //     image: ""
    // };

    return (

        <div className="navbar">
            <nav className="fixed top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex h-16 items-center px-4">

                    {/* LOGO - BRAND */}
                    <div className="flex items-center space-x-4">
                        {/* LOGO */}
                        <Link href="/">
                            <Smile className="h-6 w-6 text-primary" />
                            {/* <div className="max-w-150px"><Image src={logo} width={3000} height={1000} layout="responsive" ></Image></div> */}
                        </Link>
                        <span className="text-lg font-semibold">Moodify</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex ml-auto items-center space-x-4">
                        {session ? (<>
                            <Link href="/dashboard" className="text-sm font-medium">
                                Dashboard
                            </Link>
                            <UserMenu user={session.user} />
                        </>
                        ) : (
                            <Link href="/api/auth/signin">
                                <ButtonSignIn />
                            </Link>
                        )}
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden ml-auto mobil-nav">
                        <MobileNav user={session?.user} />
                    </div>
                </div>
            </nav>
        </div>
    )
}