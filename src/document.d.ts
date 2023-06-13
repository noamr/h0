interface Document {
  startViewTransition(update: () => PromiseLike<void>): {
    finished: PromiseLike<void>;
    ready: PromiseLike<void>;
    domUpdateCalled: PromiseLike<void>;
  };
};