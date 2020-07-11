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

    > * {
        max-width: calc(100vw - 2rem);
        box-sizing: border-box;
    }

    > img {
        margin-top: 2rem;
        height: 30vh;
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

    > span:last-child {
        opacity: 0.5;
        margin-bottom: 2rem;
        margin-top: 3rem;
    }
}
</style>
