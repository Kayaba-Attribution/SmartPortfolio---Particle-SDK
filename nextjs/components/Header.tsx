"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BugAntIcon } from "@heroicons/react/24/outline";
import { ParticleConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-20 h-10">
            <svg width="69" height="31" viewBox="0 0 69 31" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M54.0469 21.6838L49.6466 26.931C48.8729 27.8536 47.4271 27.7639 46.7734 26.7527L45.5491 24.859C45.1436 24.2318 45.1704 23.4187 45.6164 22.8196L50.3025 16.5232L44.9956 9.0808C44.6367 8.57754 44.563 7.92469 44.8007 7.35412L45.7484 5.07945C46.2749 3.8157 47.9678 3.58749 48.8101 4.6667L54.0853 11.4253L61.7572 1.5387C62.4242 0.679129 63.6977 0.609013 64.455 1.39015L66.9967 4.01158C67.637 4.67204 67.6721 5.71047 67.0778 6.41266L58.3538 16.7206L65.5978 25.8727C66.295 26.7534 66.0175 28.0512 65.0212 28.5699L62.134 30.0731C61.3535 30.4794 60.3934 30.2579 59.8698 29.5506L54.0469 21.6838Z"
                stroke="#01E599"
                strokeWidth="1.37524"
              ></path>
              <path
                d="M9.44732 11.3358C10.3499 12.1381 10.8012 13.2974 10.8012 14.8138V22.3129C10.8012 22.5298 10.6254 22.7056 10.4085 22.7056H9.22323C9.00635 22.7056 8.83054 22.5298 8.83054 22.3129V15.5148C8.83054 14.2331 8.55474 13.3044 8.00314 12.7288C7.71596 12.4383 7.37101 12.2114 6.9906 12.0626C6.61019 11.9139 6.20279 11.8467 5.79476 11.8653C5.15288 11.8626 4.51923 12.0099 3.9444 12.2955C3.34147 12.6121 2.84771 13.1027 2.52731 13.7036C2.13247 14.4588 1.94165 15.3041 1.97371 16.1557V22.3129C1.97371 22.5298 1.79789 22.7056 1.58101 22.7056H0.392696C0.175816 22.7056 0 22.5298 0 22.3129V11.3357C0 11.0569 0.282383 10.8669 0.540627 10.9719L1.46398 11.3474C1.67274 11.4323 1.81477 11.6289 1.82981 11.8537L1.85937 12.2955C2.24045 11.5845 2.83501 11.011 3.55929 10.6558C4.32238 10.2946 5.15821 10.1134 6.00236 10.1263C7.26204 10.0811 8.49234 10.5131 9.44732 11.3358Z"
                fill="white"
              ></path>
              <path
                d="M24.8803 16.9377C24.8608 17.1333 24.6937 17.2785 24.4972 17.2785H15.5434C15.6577 18.5301 16.0729 19.5009 16.789 20.1909C17.1596 20.5387 17.5958 20.8094 18.072 20.9871C18.5483 21.1647 19.0551 21.2459 19.563 21.2259C20.342 21.2534 21.1161 21.0924 21.8195 20.7565C22.2526 20.5479 22.6101 20.2161 22.8503 19.8074C22.971 19.602 23.2294 19.4981 23.4406 19.6085L24.3386 20.0779C24.5332 20.1797 24.6078 20.4222 24.4877 20.6062C24.0412 21.2905 23.435 21.8589 22.7191 22.2609C21.7435 22.7573 20.6569 22.9956 19.563 22.9529C17.7036 22.9529 16.2444 22.3853 15.1853 21.25C14.1263 20.1147 13.5958 18.5451 13.5938 16.5414C13.5938 14.5356 14.0952 12.965 15.0981 11.8297C16.101 10.6945 17.5361 10.1268 19.4035 10.1268C20.45 10.1003 21.4832 10.3649 22.3882 10.891C23.2095 11.3822 23.8694 12.1028 24.2867 12.964C24.7237 13.8793 24.9431 14.8833 24.9275 15.8975C24.9304 16.2449 24.9146 16.5922 24.8803 16.9377ZM16.789 12.8076C16.1211 13.4494 15.7139 14.352 15.5675 15.5154H23.0411C22.9753 14.5116 22.5761 13.5585 21.9068 12.8076C21.5822 12.4807 21.193 12.2251 20.7641 12.0572C20.3351 11.8894 19.8758 11.8129 19.4156 11.8327C18.9349 11.812 18.4549 11.8876 18.0039 12.055C17.5528 12.2224 17.1398 12.4783 16.789 12.8076Z"
                fill="white"
              ></path>
              <path
                d="M37.9954 11.8309C39.0564 12.9641 39.587 14.5347 39.587 16.5425C39.587 18.5503 39.0564 20.1198 37.9954 21.2511C36.9363 22.3864 35.4771 22.954 33.6177 22.954C31.7583 22.954 30.2991 22.3864 29.2401 21.2511C28.179 20.1178 27.6484 18.5483 27.6484 16.5425C27.6484 14.5367 28.179 12.9661 29.2401 11.8309C30.2991 10.6976 31.7583 10.1299 33.6177 10.1279C35.4771 10.1259 36.9363 10.6936 37.9954 11.8309ZM30.6812 13.0885C29.9752 13.9289 29.6221 15.0802 29.6221 16.5425C29.6221 18.0047 29.9752 19.155 30.6812 19.9935C31.3873 20.8319 32.3661 21.2511 33.6177 21.2511C34.8693 21.2511 35.8472 20.8319 36.5512 19.9935C37.2572 19.155 37.6112 18.0047 37.6132 16.5425C37.6153 15.0802 37.2612 13.9289 36.5512 13.0885C35.8431 12.2481 34.8653 11.8289 33.6177 11.8309C32.3701 11.8329 31.3903 12.2521 30.6782 13.0885H30.6812Z"
                fill="white"
              ></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">SmartBasket</span>
            <span className="text-xs"> Token Portfolio Manager</span>
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <ParticleConnectButton />
      </div>
    </div>
  );
};
