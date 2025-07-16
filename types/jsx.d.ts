// TypeScript definitions for Berryact JSX

declare namespace JSX {
  // Element types
  interface Element extends Berryact.VNode<any> {}
  interface ElementClass extends Berryact.Component<any> {
    render(): Berryact.VNode<any> | null;
  }
  interface ElementAttributesProperty {
    props: {};
  }
  interface ElementChildrenAttribute {
    children: {};
  }

  // Intrinsic elements (HTML elements)
  interface IntrinsicElements {
    // HTML elements
    a: HTMLAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement>;
    area: HTMLAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement>;
    audio: HTMLAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement>;
    base: HTMLAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement>;
    blockquote: HTMLAttributes<HTMLQuoteElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    canvas: HTMLAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLTableCaptionElement>;
    cite: HTMLAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement>;
    col: HTMLAttributes<HTMLTableColElement>;
    colgroup: HTMLAttributes<HTMLTableColElement>;
    data: HTMLAttributes<HTMLDataElement>;
    datalist: HTMLAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement>;
    del: HTMLAttributes<HTMLModElement>;
    details: HTMLAttributes<HTMLDetailsElement>;
    dfn: HTMLAttributes<HTMLElement>;
    dialog: HTMLAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement>;
    embed: HTMLAttributes<HTMLEmbedElement>;
    fieldset: HTMLAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement>;
    form: HTMLAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement>;
    html: HTMLAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement>;
    iframe: HTMLAttributes<HTMLIFrameElement>;
    img: HTMLAttributes<HTMLImageElement>;
    input: HTMLAttributes<HTMLInputElement>;
    ins: HTMLAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement>;
    label: HTMLAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement>;
    li: HTMLAttributes<HTMLLIElement>;
    link: HTMLAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement>;
    map: HTMLAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement>;
    meta: HTMLAttributes<HTMLMetaElement>;
    meter: HTMLAttributes<HTMLMeterElement>;
    nav: HTMLAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement>;
    object: HTMLAttributes<HTMLObjectElement>;
    ol: HTMLAttributes<HTMLOListElement>;
    optgroup: HTMLAttributes<HTMLOptGroupElement>;
    option: HTMLAttributes<HTMLOptionElement>;
    output: HTMLAttributes<HTMLOutputElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    param: HTMLAttributes<HTMLParamElement>;
    picture: HTMLAttributes<HTMLElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    progress: HTMLAttributes<HTMLProgressElement>;
    q: HTMLAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement>;
    script: HTMLAttributes<HTMLScriptElement>;
    section: HTMLAttributes<HTMLElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    small: HTMLAttributes<HTMLElement>;
    source: HTMLAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement>;
    style: HTMLAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement>;
    table: HTMLAttributes<HTMLTableElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement>;
    td: HTMLAttributes<HTMLTableCellElement>;
    template: HTMLAttributes<HTMLTemplateElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement>;
    th: HTMLAttributes<HTMLTableCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement>;
    time: HTMLAttributes<HTMLTimeElement>;
    title: HTMLAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement>;
    track: HTMLAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement>;
    var: HTMLAttributes<HTMLElement>;
    video: HTMLAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement>;

    // SVG elements
    svg: SVGAttributes<SVGSVGElement>;
    circle: SVGAttributes<SVGCircleElement>;
    clipPath: SVGAttributes<SVGClipPathElement>;
    defs: SVGAttributes<SVGDefsElement>;
    ellipse: SVGAttributes<SVGEllipseElement>;
    foreignObject: SVGAttributes<SVGForeignObjectElement>;
    g: SVGAttributes<SVGGElement>;
    image: SVGAttributes<SVGImageElement>;
    line: SVGAttributes<SVGLineElement>;
    linearGradient: SVGAttributes<SVGLinearGradientElement>;
    marker: SVGAttributes<SVGMarkerElement>;
    mask: SVGAttributes<SVGMaskElement>;
    path: SVGAttributes<SVGPathElement>;
    pattern: SVGAttributes<SVGPatternElement>;
    polygon: SVGAttributes<SVGPolygonElement>;
    polyline: SVGAttributes<SVGPolylineElement>;
    radialGradient: SVGAttributes<SVGRadialGradientElement>;
    rect: SVGAttributes<SVGRectElement>;
    stop: SVGAttributes<SVGStopElement>;
    symbol: SVGAttributes<SVGSymbolElement>;
    text: SVGAttributes<SVGTextElement>;
    textPath: SVGAttributes<SVGTextPathElement>;
    tspan: SVGAttributes<SVGTSpanElement>;
    use: SVGAttributes<SVGUseElement>;
  }

  // Global JSX namespace exports
  interface IntrinsicAttributes extends Berryact.Attributes {}
  interface IntrinsicClassAttributes<T> extends Berryact.ClassAttributes<T> {}

  // Event handler types
  type EventHandler<E extends Event> = (event: E) => void;
  type ClipboardEventHandler = EventHandler<ClipboardEvent>;
  type CompositionEventHandler = EventHandler<CompositionEvent>;
  type DragEventHandler = EventHandler<DragEvent>;
  type FocusEventHandler = EventHandler<FocusEvent>;
  type FormEventHandler = EventHandler<Event>;
  type ChangeEventHandler = EventHandler<Event>;
  type KeyboardEventHandler = EventHandler<KeyboardEvent>;
  type MouseEventHandler = EventHandler<MouseEvent>;
  type TouchEventHandler = EventHandler<TouchEvent>;
  type PointerEventHandler = EventHandler<PointerEvent>;
  type UIEventHandler = EventHandler<UIEvent>;
  type WheelEventHandler = EventHandler<WheelEvent>;
  type AnimationEventHandler = EventHandler<AnimationEvent>;
  type TransitionEventHandler = EventHandler<TransitionEvent>;

  // Base attributes
  interface DOMAttributes<T> {
    children?: Berryact.ReactNode;
    dangerouslySetInnerHTML?: {
      __html: string;
    };

    // Clipboard Events
    onCopy?: ClipboardEventHandler;
    onCopyCapture?: ClipboardEventHandler;
    onCut?: ClipboardEventHandler;
    onCutCapture?: ClipboardEventHandler;
    onPaste?: ClipboardEventHandler;
    onPasteCapture?: ClipboardEventHandler;

    // Composition Events
    onCompositionEnd?: CompositionEventHandler;
    onCompositionEndCapture?: CompositionEventHandler;
    onCompositionStart?: CompositionEventHandler;
    onCompositionStartCapture?: CompositionEventHandler;
    onCompositionUpdate?: CompositionEventHandler;
    onCompositionUpdateCapture?: CompositionEventHandler;

    // Focus Events
    onFocus?: FocusEventHandler;
    onFocusCapture?: FocusEventHandler;
    onBlur?: FocusEventHandler;
    onBlurCapture?: FocusEventHandler;

    // Form Events
    onChange?: FormEventHandler;
    onChangeCapture?: FormEventHandler;
    onBeforeInput?: FormEventHandler;
    onBeforeInputCapture?: FormEventHandler;
    onInput?: FormEventHandler;
    onInputCapture?: FormEventHandler;
    onReset?: FormEventHandler;
    onResetCapture?: FormEventHandler;
    onSubmit?: FormEventHandler;
    onSubmitCapture?: FormEventHandler;
    onInvalid?: FormEventHandler;
    onInvalidCapture?: FormEventHandler;

    // Image Events
    onLoad?: EventHandler<Event>;
    onLoadCapture?: EventHandler<Event>;
    onError?: EventHandler<Event>;
    onErrorCapture?: EventHandler<Event>;

    // Keyboard Events
    onKeyDown?: KeyboardEventHandler;
    onKeyDownCapture?: KeyboardEventHandler;
    onKeyPress?: KeyboardEventHandler;
    onKeyPressCapture?: KeyboardEventHandler;
    onKeyUp?: KeyboardEventHandler;
    onKeyUpCapture?: KeyboardEventHandler;

    // Media Events
    onAbort?: EventHandler<Event>;
    onAbortCapture?: EventHandler<Event>;
    onCanPlay?: EventHandler<Event>;
    onCanPlayCapture?: EventHandler<Event>;
    onCanPlayThrough?: EventHandler<Event>;
    onCanPlayThroughCapture?: EventHandler<Event>;
    onDurationChange?: EventHandler<Event>;
    onDurationChangeCapture?: EventHandler<Event>;
    onEmptied?: EventHandler<Event>;
    onEmptiedCapture?: EventHandler<Event>;
    onEncrypted?: EventHandler<Event>;
    onEncryptedCapture?: EventHandler<Event>;
    onEnded?: EventHandler<Event>;
    onEndedCapture?: EventHandler<Event>;
    onLoadedData?: EventHandler<Event>;
    onLoadedDataCapture?: EventHandler<Event>;
    onLoadedMetadata?: EventHandler<Event>;
    onLoadedMetadataCapture?: EventHandler<Event>;
    onLoadStart?: EventHandler<Event>;
    onLoadStartCapture?: EventHandler<Event>;
    onPause?: EventHandler<Event>;
    onPauseCapture?: EventHandler<Event>;
    onPlay?: EventHandler<Event>;
    onPlayCapture?: EventHandler<Event>;
    onPlaying?: EventHandler<Event>;
    onPlayingCapture?: EventHandler<Event>;
    onProgress?: EventHandler<Event>;
    onProgressCapture?: EventHandler<Event>;
    onRateChange?: EventHandler<Event>;
    onRateChangeCapture?: EventHandler<Event>;
    onSeeked?: EventHandler<Event>;
    onSeekedCapture?: EventHandler<Event>;
    onSeeking?: EventHandler<Event>;
    onSeekingCapture?: EventHandler<Event>;
    onStalled?: EventHandler<Event>;
    onStalledCapture?: EventHandler<Event>;
    onSuspend?: EventHandler<Event>;
    onSuspendCapture?: EventHandler<Event>;
    onTimeUpdate?: EventHandler<Event>;
    onTimeUpdateCapture?: EventHandler<Event>;
    onVolumeChange?: EventHandler<Event>;
    onVolumeChangeCapture?: EventHandler<Event>;
    onWaiting?: EventHandler<Event>;
    onWaitingCapture?: EventHandler<Event>;

    // MouseEvents
    onAuxClick?: MouseEventHandler;
    onAuxClickCapture?: MouseEventHandler;
    onClick?: MouseEventHandler;
    onClickCapture?: MouseEventHandler;
    onContextMenu?: MouseEventHandler;
    onContextMenuCapture?: MouseEventHandler;
    onDoubleClick?: MouseEventHandler;
    onDoubleClickCapture?: MouseEventHandler;
    onDrag?: DragEventHandler;
    onDragCapture?: DragEventHandler;
    onDragEnd?: DragEventHandler;
    onDragEndCapture?: DragEventHandler;
    onDragEnter?: DragEventHandler;
    onDragEnterCapture?: DragEventHandler;
    onDragExit?: DragEventHandler;
    onDragExitCapture?: DragEventHandler;
    onDragLeave?: DragEventHandler;
    onDragLeaveCapture?: DragEventHandler;
    onDragOver?: DragEventHandler;
    onDragOverCapture?: DragEventHandler;
    onDragStart?: DragEventHandler;
    onDragStartCapture?: DragEventHandler;
    onDrop?: DragEventHandler;
    onDropCapture?: DragEventHandler;
    onMouseDown?: MouseEventHandler;
    onMouseDownCapture?: MouseEventHandler;
    onMouseEnter?: MouseEventHandler;
    onMouseLeave?: MouseEventHandler;
    onMouseMove?: MouseEventHandler;
    onMouseMoveCapture?: MouseEventHandler;
    onMouseOut?: MouseEventHandler;
    onMouseOutCapture?: MouseEventHandler;
    onMouseOver?: MouseEventHandler;
    onMouseOverCapture?: MouseEventHandler;
    onMouseUp?: MouseEventHandler;
    onMouseUpCapture?: MouseEventHandler;

    // Selection Events
    onSelect?: EventHandler<Event>;
    onSelectCapture?: EventHandler<Event>;

    // Touch Events
    onTouchCancel?: TouchEventHandler;
    onTouchCancelCapture?: TouchEventHandler;
    onTouchEnd?: TouchEventHandler;
    onTouchEndCapture?: TouchEventHandler;
    onTouchMove?: TouchEventHandler;
    onTouchMoveCapture?: TouchEventHandler;
    onTouchStart?: TouchEventHandler;
    onTouchStartCapture?: TouchEventHandler;

    // Pointer Events
    onPointerDown?: PointerEventHandler;
    onPointerDownCapture?: PointerEventHandler;
    onPointerMove?: PointerEventHandler;
    onPointerMoveCapture?: PointerEventHandler;
    onPointerUp?: PointerEventHandler;
    onPointerUpCapture?: PointerEventHandler;
    onPointerCancel?: PointerEventHandler;
    onPointerCancelCapture?: PointerEventHandler;
    onPointerEnter?: PointerEventHandler;
    onPointerEnterCapture?: PointerEventHandler;
    onPointerLeave?: PointerEventHandler;
    onPointerLeaveCapture?: PointerEventHandler;
    onPointerOver?: PointerEventHandler;
    onPointerOverCapture?: PointerEventHandler;
    onPointerOut?: PointerEventHandler;
    onPointerOutCapture?: PointerEventHandler;
    onGotPointerCapture?: PointerEventHandler;
    onGotPointerCaptureCapture?: PointerEventHandler;
    onLostPointerCapture?: PointerEventHandler;
    onLostPointerCaptureCapture?: PointerEventHandler;

    // UI Events
    onScroll?: UIEventHandler;
    onScrollCapture?: UIEventHandler;

    // Wheel Events
    onWheel?: WheelEventHandler;
    onWheelCapture?: WheelEventHandler;

    // Animation Events
    onAnimationStart?: AnimationEventHandler;
    onAnimationStartCapture?: AnimationEventHandler;
    onAnimationEnd?: AnimationEventHandler;
    onAnimationEndCapture?: AnimationEventHandler;
    onAnimationIteration?: AnimationEventHandler;
    onAnimationIterationCapture?: AnimationEventHandler;

    // Transition Events
    onTransitionEnd?: TransitionEventHandler;
    onTransitionEndCapture?: TransitionEventHandler;
  }

  // HTML attributes
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    // Standard HTML Attributes
    accessKey?: string;
    className?: string;
    contentEditable?: boolean | "true" | "false";
    contextMenu?: string;
    dir?: "ltr" | "rtl" | "auto";
    draggable?: boolean;
    hidden?: boolean;
    id?: string;
    lang?: string;
    placeholder?: string;
    slot?: string;
    spellCheck?: boolean;
    style?: CSSProperties | string;
    tabIndex?: number;
    title?: string;
    translate?: "yes" | "no";

    // Unknown
    inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
    is?: string;
    radioGroup?: string;

    // WAI-ARIA
    role?: string;

    // RDFa Attributes
    about?: string;
    datatype?: string;
    inlist?: any;
    prefix?: string;
    property?: string;
    resource?: string;
    typeof?: string;
    vocab?: string;

    // HTML Attributes
    autoCapitalize?: string;
    autoCorrect?: string;
    autoSave?: string;
    color?: string;
    itemProp?: string;
    itemScope?: boolean;
    itemType?: string;
    itemID?: string;
    itemRef?: string;
    results?: number;
    security?: string;
    unselectable?: "on" | "off";

    // Living Standard
    enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  }

  // SVG attributes
  interface SVGAttributes<T> extends DOMAttributes<T> {
    // Attributes which are defined on SVG namespace
    className?: string;
    color?: string;
    height?: number | string;
    id?: string;
    lang?: string;
    max?: number | string;
    media?: string;
    method?: string;
    min?: number | string;
    name?: string;
    style?: CSSProperties | string;
    target?: string;
    type?: string;
    width?: number | string;

    // Other HTML properties supported by SVG elements in browsers
    role?: string;
    tabIndex?: number;
    crossOrigin?: "anonymous" | "use-credentials" | "";

    // SVG Specific attributes
    accentHeight?: number | string;
    accumulate?: "none" | "sum";
    additive?: "replace" | "sum";
    alignmentBaseline?: "auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" | "central" | "after-edge" | "text-after-edge" | "ideographic" | "alphabetic" | "hanging" | "mathematical" | "inherit";
    allowReorder?: "no" | "yes";
    alphabetic?: number | string;
    amplitude?: number | string;
    arabicForm?: "initial" | "medial" | "terminal" | "isolated";
    ascent?: number | string;
    attributeName?: string;
    attributeType?: string;
    autoReverse?: boolean;
    azimuth?: number | string;
    baseFrequency?: number | string;
    baselineShift?: number | string;
    baseProfile?: number | string;
    bbox?: number | string;
    begin?: number | string;
    bias?: number | string;
    by?: number | string;
    calcMode?: number | string;
    capHeight?: number | string;
    clip?: number | string;
    clipPath?: string;
    clipPathUnits?: number | string;
    clipRule?: number | string;
    colorInterpolation?: number | string;
    colorInterpolationFilters?: "auto" | "sRGB" | "linearRGB" | "inherit";
    colorProfile?: number | string;
    colorRendering?: number | string;
    contentScriptType?: number | string;
    contentStyleType?: number | string;
    cursor?: number | string;
    cx?: number | string;
    cy?: number | string;
    d?: string;
    decelerate?: number | string;
    descent?: number | string;
    diffuseConstant?: number | string;
    direction?: number | string;
    display?: number | string;
    divisor?: number | string;
    dominantBaseline?: number | string;
    dur?: number | string;
    dx?: number | string;
    dy?: number | string;
    edgeMode?: number | string;
    elevation?: number | string;
    enableBackground?: number | string;
    end?: number | string;
    exponent?: number | string;
    externalResourcesRequired?: boolean;
    fill?: string;
    fillOpacity?: number | string;
    fillRule?: "nonzero" | "evenodd" | "inherit";
    filter?: string;
    filterRes?: number | string;
    filterUnits?: number | string;
    floodColor?: number | string;
    floodOpacity?: number | string;
    focusable?: boolean | "true" | "false";
    fontFamily?: string;
    fontSize?: number | string;
    fontSizeAdjust?: number | string;
    fontStretch?: number | string;
    fontStyle?: number | string;
    fontVariant?: number | string;
    fontWeight?: number | string;
    format?: number | string;
    from?: number | string;
    fx?: number | string;
    fy?: number | string;
    g1?: number | string;
    g2?: number | string;
    glyphName?: number | string;
    glyphOrientationHorizontal?: number | string;
    glyphOrientationVertical?: number | string;
    glyphRef?: number | string;
    gradientTransform?: string;
    gradientUnits?: string;
    hanging?: number | string;
    horizAdvX?: number | string;
    horizOriginX?: number | string;
    href?: string;
    ideographic?: number | string;
    imageRendering?: number | string;
    in2?: number | string;
    in?: string;
    intercept?: number | string;
    k1?: number | string;
    k2?: number | string;
    k3?: number | string;
    k4?: number | string;
    k?: number | string;
    kernelMatrix?: number | string;
    kernelUnitLength?: number | string;
    kerning?: number | string;
    keyPoints?: number | string;
    keySplines?: number | string;
    keyTimes?: number | string;
    lengthAdjust?: number | string;
    letterSpacing?: number | string;
    lightingColor?: number | string;
    limitingConeAngle?: number | string;
    local?: number | string;
    markerEnd?: string;
    markerHeight?: number | string;
    markerMid?: string;
    markerStart?: string;
    markerUnits?: number | string;
    markerWidth?: number | string;
    mask?: string;
    maskContentUnits?: number | string;
    maskUnits?: number | string;
    mathematical?: number | string;
    mode?: number | string;
    numOctaves?: number | string;
    offset?: number | string;
    opacity?: number | string;
    operator?: number | string;
    order?: number | string;
    orient?: number | string;
    orientation?: number | string;
    origin?: number | string;
    overflow?: number | string;
    overlinePosition?: number | string;
    overlineThickness?: number | string;
    paintOrder?: number | string;
    panose1?: number | string;
    pathLength?: number | string;
    patternContentUnits?: string;
    patternTransform?: number | string;
    patternUnits?: string;
    pointerEvents?: number | string;
    points?: string;
    pointsAtX?: number | string;
    pointsAtY?: number | string;
    pointsAtZ?: number | string;
    preserveAlpha?: boolean;
    preserveAspectRatio?: string;
    primitiveUnits?: number | string;
    r?: number | string;
    radius?: number | string;
    refX?: number | string;
    refY?: number | string;
    renderingIntent?: number | string;
    repeatCount?: number | string;
    repeatDur?: number | string;
    requiredExtensions?: number | string;
    requiredFeatures?: number | string;
    restart?: number | string;
    result?: string;
    rotate?: number | string;
    rx?: number | string;
    ry?: number | string;
    scale?: number | string;
    seed?: number | string;
    shapeRendering?: number | string;
    slope?: number | string;
    spacing?: number | string;
    specularConstant?: number | string;
    specularExponent?: number | string;
    speed?: number | string;
    spreadMethod?: string;
    startOffset?: number | string;
    stdDeviation?: number | string;
    stemh?: number | string;
    stemv?: number | string;
    stitchTiles?: number | string;
    stopColor?: string;
    stopOpacity?: number | string;
    strikethroughPosition?: number | string;
    strikethroughThickness?: number | string;
    string?: number | string;
    stroke?: string;
    strokeDasharray?: string | number;
    strokeDashoffset?: string | number;
    strokeLinecap?: "butt" | "round" | "square" | "inherit";
    strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
    strokeMiterlimit?: number | string;
    strokeOpacity?: number | string;
    strokeWidth?: number | string;
    surfaceScale?: number | string;
    systemLanguage?: number | string;
    tableValues?: number | string;
    targetX?: number | string;
    targetY?: number | string;
    textAnchor?: string;
    textDecoration?: number | string;
    textLength?: number | string;
    textRendering?: number | string;
    to?: number | string;
    transform?: string;
    u1?: number | string;
    u2?: number | string;
    underlinePosition?: number | string;
    underlineThickness?: number | string;
    unicode?: number | string;
    unicodeBidi?: number | string;
    unicodeRange?: number | string;
    unitsPerEm?: number | string;
    vAlphabetic?: number | string;
    values?: string;
    vectorEffect?: number | string;
    version?: string;
    vertAdvY?: number | string;
    vertOriginX?: number | string;
    vertOriginY?: number | string;
    vHanging?: number | string;
    vIdeographic?: number | string;
    viewBox?: string;
    viewTarget?: number | string;
    visibility?: number | string;
    vMathematical?: number | string;
    widths?: number | string;
    wordSpacing?: number | string;
    writingMode?: number | string;
    x1?: number | string;
    x2?: number | string;
    x?: number | string;
    xChannelSelector?: string;
    xHeight?: number | string;
    xlinkActuate?: string;
    xlinkArcrole?: string;
    xlinkHref?: string;
    xlinkRole?: string;
    xlinkShow?: string;
    xlinkTitle?: string;
    xlinkType?: string;
    xmlBase?: string;
    xmlLang?: string;
    xmlns?: string;
    xmlnsXlink?: string;
    xmlSpace?: string;
    y1?: number | string;
    y2?: number | string;
    y?: number | string;
    yChannelSelector?: string;
    z?: number | string;
    zoomAndPan?: string;
  }

  // CSS Properties
  interface CSSProperties {
    [key: string]: any;
  }
}

// Module augmentation for Berryact types
declare module '@oxog/berryact' {
  export namespace Berryact {
    type ReactNode = 
      | VNode<any>
      | string
      | number
      | boolean
      | null
      | undefined
      | ReactNode[];

    interface VNode<P = {}> {
      $$typeof: symbol;
      type: string | ComponentType<P>;
      props: P & { children?: ReactNode };
      key: string | null;
      ref: any;
    }

    interface Attributes {
      key?: string | number;
      ref?: any;
    }

    interface ClassAttributes<T> extends Attributes {
      ref?: LegacyRef<T>;
    }

    type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;

    interface FunctionComponent<P = {}> {
      (props: P & { children?: ReactNode }): VNode<any> | null;
      displayName?: string;
    }

    interface ComponentClass<P = {}> {
      new (props: P): Component<P>;
      displayName?: string;
    }

    interface Component<P = {}> {
      props: Readonly<P> & Readonly<{ children?: ReactNode }>;
      render(): VNode<any> | null;
    }

    type LegacyRef<T> = string | Ref<T>;

    interface RefObject<T> {
      readonly current: T | null;
    }

    type Ref<T> = RefCallback<T> | RefObject<T> | null;
    type RefCallback<T> = (instance: T | null) => void;
  }
}