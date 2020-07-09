/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import gradAffFactory from '@/assets/pkg/grad_aff.js';

let gradAff: any;

export default async function () {
    if (gradAff === undefined) {
        gradAff = await (gradAffFactory() as Promise<any>);
        await gradAff.ready;
    }

    return gradAff;
};
