
interface ViewTransitionNavParams {
  update(): void | PromiseLike<void>;
  urls?: {
    old: string,
    new: string
  };
};

interface NavMatcher {
  pattern: string;
  direction: "outgoing" | "incoming" | "both";
}

interface AutoViewTransitionsOptions {
  root: HTMLElement;
  navigate?: (url: string) => Promise<void> | void;
  crossDocument?: boolean;
  navigations?: {
    [name: string]: {
      urlPatterns: string[]
      direction?: "outgoing" | "incoming"
    }
  }
  config?: {
    sessionStorageKey: string,
    oldLinkClassname: string,
    newLinkClassname: string,
    extraLinkMatcher: string
  }
}

export default function initializeAutoViewTransitions(options: AutoViewTransitionsOptions) {
  const {root, navigate, crossDocument, config} = options;
  const oldLinkClassname = config?.oldLinkClassname || "vt-old";
  const newLinkClassname = config?.oldLinkClassname || "vt-new";
  const linkMatcher = config?.extraLinkMatcher ? `a[href]:is(${config.extraLinkMatcher})` : "a[href]";

  let prevURL = location.href;

  let navigations = [] as [string, NavMatcher][];
  const navsElement = document.head.querySelector("script[type=navs]");
  if (navsElement)
    navigations = Object.entries(JSON.parse(navsElement.innerHTML) as {[key: string]: NavMatcher});

  function updateLinks(urls: {old: string, new: string}) {
    for (const link of document.querySelectorAll(linkMatcher)) {
      const {href} = link as HTMLAnchorElement;
      link.classList.toggle(newLinkClassname, href === urls.new);
      link.classList.toggle(oldLinkClassname, href === urls.old);
    }

    const navs = navigations.filter(([, nav]) => {
      const pattern = new URLPattern(nav.pattern, location.href);
      console.log(pattern, pattern.test(urls.old), pattern.test(urls.new), urls)
      return (nav.direction !== "outgoing" && pattern.test(urls.old)) ||
      (nav.direction !== "incoming" && pattern.test(urls.new));
    });

    document.documentElement.dataset.navs = navs.map(nav => nav[0]).join(" ");
    prevURL = urls.new;
    debugger;
  }

  if (crossDocument) {
    const sessionStorageKey = config?.sessionStorageKey || "vt-prev-url";
    const stored = sessionStorage.getItem(sessionStorageKey);
    if (stored)
      updateLinks({old: stored, new: location.href});
    sessionStorage.setItem(sessionStorageKey, location.href);
  }

  async function navigateWithTransition(params: ViewTransitionNavParams) {
    if (!document.startViewTransition) {
      params.update();
      return;
    }

    if (params.urls)
      updateLinks(params.urls);

    if (!navigate)
      return;

    document.startViewTransition(async () => {
      await params.update();
      if (params.urls)
        updateLinks(params.urls);
    });
  }

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest(linkMatcher) as HTMLAnchorElement;
    if (!anchor)
      return;

    if (!navigate) {
      updateLinks({old: location.href, new: anchor.href});
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    navigateWithTransition({
        urls: {
          old: location.href,
          new: anchor.href
        },
        update: () => navigate(anchor.href)
    });
  }, {capture: true});

  if (!navigate)
    return;

  window.addEventListener("popstate", () => {
    navigateWithTransition({
      urls: {
        old: prevURL!,
        new: location.href
      },
      update: () =>
        navigate(location.href)
    });
  });
}
