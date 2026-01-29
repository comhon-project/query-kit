import type { Ref } from 'vue';

function getVisibleTreeitems(treeEl: HTMLElement): HTMLElement[] {
  const all = treeEl.querySelectorAll<HTMLElement>('[role="treeitem"]');
  return Array.from(all).filter((el) => {
    let parent = el.parentElement;
    while (parent && parent !== treeEl) {
      if (parent.getAttribute('role') === 'treeitem' && parent.getAttribute('aria-expanded') === 'false') {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  });
}

function getSiblings(treeitem: HTMLElement): HTMLElement[] {
  const parentGroup = treeitem.closest('[role="group"]');
  if (!parentGroup) return [treeitem];
  return Array.from(parentGroup.querySelectorAll<HTMLElement>('[role="treeitem"]')).filter(
    (item) => item.closest('[role="group"]') === parentGroup,
  );
}

function focusTreeitem(current: HTMLElement, target: HTMLElement): void {
  current.setAttribute('tabindex', '-1');
  target.setAttribute('tabindex', '0');
  target.focus();
}

function navigateList(current: HTMLElement, list: HTMLElement[], direction: 'next' | 'prev' | 'first' | 'last'): void {
  const index = list.indexOf(current);
  let target: HTMLElement | undefined;
  if (direction === 'next') target = list[index + 1];
  else if (direction === 'prev') target = list[index - 1];
  else if (direction === 'first') target = list[0];
  else if (direction === 'last') target = list[list.length - 1];
  if (target && target !== current) focusTreeitem(current, target);
}

export function useTreeNavigation(treeRef: Ref<HTMLElement | null>, onExit?: () => void) {
  function initTabindex(): void {
    if (!treeRef.value) return;
    const items = getVisibleTreeitems(treeRef.value);
    for (const item of items) {
      item.setAttribute('tabindex', '-1');
    }
    items[0]?.setAttribute('tabindex', '0');
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!treeRef.value) return;

    const eventTarget = event.target as HTMLElement;
    if (eventTarget.closest('dialog')) {
      return;
    }

    const tagName = eventTarget.tagName.toLowerCase();
    const isFormElement = tagName === 'input' || tagName === 'select' || tagName === 'textarea';
    if (isFormElement && event.key !== 'Escape') {
      return;
    }

    const target = eventTarget.closest('[role="treeitem"]') as HTMLElement | null;
    if (!target) return;

    const items = getVisibleTreeitems(treeRef.value);
    if (items.indexOf(target) === -1) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 'next' : 'prev';
        const list = event.ctrlKey ? getSiblings(target) : items;
        navigateList(target, list, direction);
        break;
      }
      case 'Home':
      case 'End': {
        event.preventDefault();
        navigateList(target, items, event.key === 'Home' ? 'first' : 'last');
        break;
      }
      case 'PageUp':
      case 'PageDown': {
        event.preventDefault();
        navigateList(target, getSiblings(target), event.key === 'PageUp' ? 'first' : 'last');
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        const expanded = target.getAttribute('aria-expanded');
        if (expanded === 'false') {
          target.dispatchEvent(new CustomEvent('tree-toggle', { bubbles: false }));
        } else if (expanded === 'true') {
          const firstChild = target.querySelector<HTMLElement>('[role="treeitem"]');
          if (firstChild) focusTreeitem(target, firstChild);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const expanded = target.getAttribute('aria-expanded');
        if (expanded === 'true') {
          target.dispatchEvent(new CustomEvent('tree-toggle', { bubbles: false }));
        } else {
          const parentGroup = target.closest('[role="group"]');
          const parentItem = parentGroup?.closest('[role="treeitem"]') as HTMLElement | null;
          if (parentItem) focusTreeitem(target, parentItem);
        }
        break;
      }
      case 'Escape': {
        const eventTarget = event.target as HTMLElement;
        if (eventTarget !== target) {
          event.preventDefault();
          target.focus();
        } else {
          const parentGroup = target.closest('[role="group"]');
          const parentItem = parentGroup?.closest('[role="treeitem"]') as HTMLElement | null;
          if (parentItem) {
            event.preventDefault();
            focusTreeitem(target, parentItem);
          } else if (onExit) {
            event.preventDefault();
            onExit();
          }
        }
        break;
      }
    }
  }

  return { handleKeydown, initTabindex };
}
