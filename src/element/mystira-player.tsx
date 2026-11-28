import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Player } from '../player/Player';
import type { Answer, Engine, StartSessionRequest, Step } from '../engine/types';
import playerCss from '../player/Player.module.css?inline';

const elementCss = `
:host { display:block; min-height:0; font-family:Inter,ui-rounded,system-ui,sans-serif; color:var(--mp-text); --mp-bg:#1a0d2e; --mp-surface:#2a1a4a; --mp-text:#f5e6d3; --mp-muted:#d1c0df; --mp-accent:#ffc17a; --mp-overlay:#1a0d2e; --mp-radius:1rem; --mp-glow:0 0 20px rgba(232,149,74,.3); }
:host([theme="mystira-light"]) { --mp-bg:#f5f3ed; --mp-surface:#fff; --mp-text:#202838; --mp-muted:#4c5668; --mp-accent:#55358f; --mp-overlay:#fff; --mp-glow:0 2px 14px #20283822; }
:host([theme="mystira-dark"]) { --mp-bg:#151927; --mp-surface:#272e42; --mp-text:#f6f6fa; --mp-muted:#c4ccdc; --mp-accent:#c8a8ff; --mp-overlay:#202637; --mp-glow:0 2px 18px #0008; }
:host([theme="mystira-bright"]) { --mp-bg:#fff7d9; --mp-surface:#fff; --mp-text:#262044; --mp-muted:#51486f; --mp-accent:#7032a0; --mp-overlay:#fff; --mp-glow:0 2px 14px #7032a033; }
*,*::before,*::after { box-sizing:border-box; }
[part="player"] { min-height:100%; height:100%; }
[part="end-cta"] { display:none; }
:host([data-complete]) [part="end-cta"] { display:block; }
${playerCss.replace(/min-height:100vh/g, 'min-height:100%')}`;

export class MystiraPlayerElement extends HTMLElement {
  static observedAttributes = ['theme', 'music', 'locale', 'notes'];

  private reactRoot?: Root;
  private mount?: HTMLDivElement;
  private hostEngine?: Engine;
  private startRequest?: StartSessionRequest;
  private resumeId?: string;
  private sessionKey = 0;
  private isMuted = false;
  private hadGesture = false;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = elementCss;
    shadow.append(style);
    this.mount = document.createElement('div');
    this.mount.setAttribute('part', 'player');
    shadow.append(this.mount);
    const end = document.createElement('div');
    end.setAttribute('part', 'end-cta');
    const slot = document.createElement('slot');
    slot.name = 'end-cta';
    end.append(slot);
    shadow.append(end);
  }

  get engine(): Engine | undefined { return this.hostEngine; }
  set engine(value: Engine | undefined) { this.hostEngine = value; this.renderPlayer(); }

  get muted(): boolean { return this.isMuted; }
  set muted(value: boolean) { this.isMuted = Boolean(value); this.renderPlayer(); }

  connectedCallback(): void {
    if (!this.reactRoot && this.mount) this.reactRoot = createRoot(this.mount);
    this.renderPlayer();
    this.emit('mp-ready', {});
  }

  disconnectedCallback(): void {
    this.reactRoot?.unmount();
    this.reactRoot = undefined;
    this.startRequest = undefined;
    this.resumeId = undefined;
    this.removeAttribute('data-complete');
  }

  attributeChangedCallback(): void { this.renderPlayer(); }

  start(request: StartSessionRequest): void {
    if (!this.hostEngine) throw new Error('Assign an Engine before calling start.');
    this.startRequest = request;
    this.resumeId = undefined;
    this.hadGesture = navigator.userActivation?.hasBeenActive ?? false;
    this.sessionKey += 1;
    this.removeAttribute('data-complete');
    this.renderPlayer();
  }

  resume(sessionId: string): void {
    if (!this.hostEngine) throw new Error('Assign an Engine before calling resume.');
    this.startRequest = undefined;
    this.resumeId = sessionId;
    this.hadGesture = navigator.userActivation?.hasBeenActive ?? false;
    this.sessionKey += 1;
    this.removeAttribute('data-complete');
    this.renderPlayer();
  }

  private emit(name: string, detail: object): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private onStep = (step: Step): void => {
    const { node, sessionId } = step;
    this.emit('mp-node-enter', { sessionId, nodeId: node.id, nodeType: node.type, ...(node.music ? { music: node.music.profile } : {}), exitAllowed: node.exitAllowed ?? true });
    if (node.type === 'result' || node.type === 'terminal') {
      this.setAttribute('data-complete', '');
      this.emit('mp-complete', { sessionId });
    } else this.removeAttribute('data-complete');
  };

  private onAnswer = (sessionId: string, nodeId: string, answerKind: Answer['kind']): void => {
    this.emit('mp-answer', { sessionId, nodeId, answerKind });
  };

  private renderPlayer(): void {
    if (!this.reactRoot) return;
    if (!this.hostEngine || (!this.startRequest && !this.resumeId)) {
      this.reactRoot.render(null);
      return;
    }
    this.reactRoot.render(createElement(Player, {
      key: this.sessionKey,
      engine: this.hostEngine,
      ...(this.startRequest ? { startRequest: this.startRequest } : { resumeSessionId: this.resumeId }),
      notesEnabled: this.getAttribute('notes') === 'on',
      grownUpAuthorized: this.getAttribute('notes') === 'on',
      inheritTheme: true,
      muted: this.isMuted,
      initialGesture: this.hadGesture,
      onStep: this.onStep,
      onAnswer: this.onAnswer,
      onError: (kind, retryable) => this.emit('mp-error', { kind, retryable }),
    }));
  }
}

export function defineMystiraPlayer(): void {
  if (!customElements.get('mystira-player')) customElements.define('mystira-player', MystiraPlayerElement);
}
