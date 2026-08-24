import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Daniel Graviet",
  description:
    "Daniel Graviet is a CS student at BYU studying the systems underneath machine learning.",
};

export default function Home() {
  return (
    <article className="mx-auto max-w-xl space-y-8 pb-8 text-[17px] leading-[1.7] text-foreground md:text-[18px]">
      <p>
        Hey, I&apos;m Daniel. I&apos;m a Research Engineer at Daytona. Currently
        finishing up CS degree at BYU. I am interested in the
        systems side of machine learning. Infrastructure for reliable and scalable
        reinforcement learning rollouts, model serving, and more.
      </p>

      <Photo src="/boat.JPEG" alt="Out on the water" priority />

      <p>
      I got here by trying a lot of things first. Early on, I built with Arduinos, then moved to my first paying job working with PHP, then to C++, and now mainly Python. (I do miss C++, though.) My favorite class so far has been Machine Learning, where we covered more classical models specifically KNN, SVM's, and MLP's.
      </p>
      <Photo src="/friends.JPEG" alt="With friends" />
      <p>
        Right now I&apos;m focused on CPU optimization by gaining a good foundation in computer architecture, operating systems, and virtualization. (sandboxing)
      </p>
      <p>
        Outside of that I&apos;m usually with with family & friends, reading, and working on side projects.
      </p>
    </article>
  );
}

function Photo({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <figure className="-mx-1">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1200}
        priority={priority}
        className="h-auto w-full"
        sizes="(min-width: 768px) 36rem, 100vw"
      />
    </figure>
  );
}
