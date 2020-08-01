<template>
    <main class="grad-home">
        <img src="@/assets/logo.svg" alt="logo" />
        <h1>ARMA 3 PAA CONVERTER</h1>
        <section>
            This free image to PAA - PAA to PNG Converter works 100% in the browser.<br/>
            Just drag your image or .paa files into this window or click the button below to start converting files to the corresponding format.<br/>
            <b>Your files wont be uploaded anwhere. Everything is processed on your machine.</b>
        </section>
        <button @click="$emit('convert')">
            <i class="material-icons">add</i>
            <span>Convert Files</span>
        </button>
        <span>Thanks to BI and the Arma3 Community for being awesome</span>
        <span>Also check out our PAA plugins for</span>
        <div>
            <a href="https://github.com/gruppe-adler/paa-gimp-plugin" target="_blank" rel="noreferrer">
                <img alt="gimp-logo" src="@/assets/gimp.svg" />
                <span>Gimp</span>
            </a>
            <a href="https://github.com/gruppe-adler/PaaPhotoshopPlugin" target="_blank" rel="noreferrer">
                <img alt="photoshop-logo" src="@/assets/photoshop.svg" />
                <span>Photoshop</span>
            </a>
        </div>
    </main>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class HomeVue extends Vue {}
</script>

<style scoped lang="scss">
.grad-home {
    justify-self: stretch;
    align-self: center;
    overflow-y: auto;
    max-height: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 0;
    box-sizing: border-box;

    > * {
        max-width: calc(100vw - 2rem);
        box-sizing: border-box;
    }

    > img {
        height: 30vh;
    }

    > h1 {
        margin: 1rem 0 0 0;
    }

    > section {
        padding: 0.75rem 1rem;
        margin: 1.5rem 0;
        background-color: var(--color-container);
        border-radius: .5rem;
        width: 37rem;
        line-height: 1.5em;
        letter-spacing: 0.03em;
    }

    > span {
        opacity: 0.5;
        margin-top: 2rem;
        margin-bottom: 1rem;

        &:first-of-type {
            margin-top: 3rem;
        }
    }

    > div:last-child {
        display: grid;
        grid-template-columns: auto auto;
        grid-column-gap: 2rem;

        > a {
            display: grid;
            grid-template-rows: auto auto;
            grid-row-gap: .5rem;
            align-items: stretch;
            justify-items: center;
            opacity: 0.5;
            transition: opacity 0.05s ease-in-out;

            &:hover {
                opacity: 1;
            }

            > img {
                width: 3rem;
                opacity: 0.7;
                filter: invert(100%);
            }

            @media (prefers-color-scheme: dark) {
                > img {
                    filter: unset;
                }
            }
        }
    }
}
</style>
