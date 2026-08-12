import React from 'react'
import { motion } from "framer-motion";
import Image from "next/image";

const DescriptionDashboard = () => {
  return (
    <div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                amount: 0.5,
                once: false,
              }}
              className="flex-center relative w-full max-w-[1200px]"
            >
              <motion.div
                variants={{
                  hidden: {
                    x: 250,
                    opacity: 0,
                    scale: 0.9,
                  },
                  visible: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                  },
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute left-[40px] z-0"
              >
                <Image
                  src="/assets/man_running.png"
                  alt="man running"
                  width={1536}
                  height={1024}
                  className="w-[200px] rounded-2xl"
                />
              </motion.div>
              <Image
                src="/assets/macbook.png"
                alt="macbook"
                width={1536}
                height={1024}
                className="w-[650px]  drop-shadow-[0px_18px_20px] shadow-gray-950"
              />
    
              <motion.div
                variants={{
                  hidden: {
                    x: -250,
                    opacity: 0,
                    scale: 0.9,
                  },
                  visible: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                  },
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute right-[40px] z-0"
              >
                <Image
                  src="/assets/watch.png"
                  alt="Smart watch"
                  width={200}
                  height={260}
                  className="rounded-2xl object-cover"
                />
              </motion.div>
            </motion.div>
          </div>
  )
}

export default DescriptionDashboard