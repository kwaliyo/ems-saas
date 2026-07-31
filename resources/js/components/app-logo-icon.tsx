import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M12 2L3 7V12C3 17.5228 7.02944 22.0964 12 23C16.9706 22.0964 21 17.5228 21 12V7L12 2Z"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M8 7V17M8 12L14 7M10.5 12L15 17"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="17" cy="7" r="1.75" fill="currentColor" />
        </svg>
    );
}
