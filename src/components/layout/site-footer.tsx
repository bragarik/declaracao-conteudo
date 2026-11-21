// SPDX-License-Identifier: GPL-3.0-only
import { ProjectSupport } from '../../features/support/project-support';
import { CreatorCredit } from './creator-credit';

export function SiteFooter() {
  return (
    <footer class="screen-only mt-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-base-300 pt-5 text-sm text-base-content/70">
      <CreatorCredit />
      <ProjectSupport />
    </footer>
  );
}
