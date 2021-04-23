/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import gradAffFactory from '@/assets/pkg/grad_aff.js';

type GradAFF = { [key: string]: any };

let gradAffPromise: Promise<GradAFF>|undefined;

async function setupAFF(): Promise<GradAFF> {
    if (gradAffPromise === undefined) {
        gradAffPromise = (gradAffFactory() as Promise<GradAFF>).then(async gradAff => {
            await gradAff.ready;
            return gradAff;
        });
    }

    return await gradAffPromise;
}

export default setupAFF;
