import Lottie, { AnimationItem as LottieAnimationItem } from 'lottie-web';
import * as lottieData from '@/assets/logo.json';

export default class HomeController extends EventTarget {
    private element: HTMLElement;
    private lottie: LottieAnimationItem;

    constructor(homeElem: HTMLElement) {
        super();
        this.element = homeElem;

        // Handle clicks for "convert files" button
        this.element.querySelector('button').addEventListener('click', () => { this.dispatchEvent(new Event('convert-files')); });

        this.setupLottie();
    }

    private setupLottie() {
        const logoElement = this.element.querySelector('[data-grad-paa-lottie]');
        if (logoElement === null) {
            // eslint-disable-next-line no-console
            console.error('Couldn\'t find lottie element');
            return;
        }

        logoElement.removeAttribute('data-grad-paa-lottie');

        // remove placeholder image
        logoElement.innerHTML = '';

        this.lottie = Lottie.loadAnimation({
            container: logoElement,
            renderer: 'canvas',
            loop: true,
            autoplay: true,
            animationData: lottieData
        });
        this.lottie.play();

        window.addEventListener('resize', () => {
            window.requestAnimationFrame(() => {
                this.lottie.resize();
            });
        });
    }

    public toggle (shown: boolean): void {
        if (shown) {
            this.element.style.display = '';

            window.requestAnimationFrame(() => {
                this.lottie.resize();
            });
        } else {
            this.element.style.display = 'none';
        }
    }
}
