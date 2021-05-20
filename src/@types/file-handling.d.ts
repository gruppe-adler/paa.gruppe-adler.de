export {};

type LaunchConsumer = (launchParams: LaunchParams) => any;

declare global {
    interface LaunchParams {
        files: FileSystemFileHandle[];
    }

    interface LaunchQueue {
        setConsumer(consumer: LaunchConsumer): void;
    }

    interface Window {
        launchQueue: LaunchQueue;
    }
}
