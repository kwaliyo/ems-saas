import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Open Book Pages Base */}
            <path
                d="M2 6C2 4.89543 2.89543 4 4 4H10C11.1046 4 12 4.89543 12 6V19C11 18 9.5 17.5 8 17.5C6.5 17.5 4 18 2 19V6Z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="M22 6C22 4.89543 21.1046 4 20 4H14C12.8954 4 12 4.89543 12 6V19C13 18 14.5 17.5 16 17.5C17.5 17.5 20 18 22 19V6Z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path d="M12 4V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

            {/* Exam Pen / Nib */}
            <path
                d="M14 2L18.5 6.5L9.5 15.5H5V11L14 2Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Assessment Checkmark Badge */}
            <path
                d="M17.5 14L19.5 16L22.5 12.5"
                stroke="#34D399"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
