
"use client";

import React from 'react';
import { Inter } from "next/font/google";
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';


const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} flex items-center justify-center py-6 `}>
      <div className="max-w-xl w-full  bg-white/60 dark:bg-[#1c1c1e]/80 backdrop-blur-[30px] backdrop-saturate-[180%] rounded-2xl overflow-hidden border border-white/30 dark:border-white/10  shadow-apple dark:shadow-apple-dark">
          <div className=" mx-auto px-4 ">
            <div className="flex justify-start items-center h-16 relative nav-container">
              <Link href="/" className="group flex items-center space-x-3" aria-label="Nothing2C Home">
                <div className="relative">
                  <motion.div
                    whileHover={{
                      scale: 1.12,
                      rotate: [0, -8, 12, -3, 0],
                      transition: { duration: 0.4 }
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 450, damping: 15 }}
                    className="relative z-10"
                  >
                    <Image
                      src="/icons/popcorn.png"
                      alt=""
                      width={46}
                      height={46}
                      className="drop-shadow-lg filter"
                      priority
                    />
                  </motion.div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold tracking-tight relative">
                      <span className="text-pink">Nothing</span>
                      <sup className="absolute -right-5 text-xs font-bold text-pink">2C</sup>
                    </span>
                  </div>
                  <span className="text-[10px] text-pin-secondary dark:text-label-secondary-dark font-medium tracking-widest uppercase -mt-0.5 ml-0.5">
                    Entertainment
                  </span>
                </div>
              </Link>
            </div>
          </div>
          {children}
        </div>
    </div>
  );
}
