import { Check, ExternalLink, X } from 'lucide-react';
import type { Repository } from '@/types/repository';

type RepositoryDetailsProps = {
  repository: Repository;
  onClose: () => void;
};

function RepoAvatar({
  repository,
}: {
  repository: Repository;
}) {
  const classes = {
    cyan: 'bg-[#12bce8] text-[#062035]',
    violet: 'bg-[#a873f4] text-[#1b0d31]',
    amber: 'bg-[#ffc10c] text-[#281a00]',
  };

  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-[12px] font-bold ${classes[repository.tone]}`}
    >
      {repository.owner.slice(0, 1).toUpperCase()}
    </div>
  );
}

function StatusPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#145e5d] bg-[#0b4848]/60 px-2 py-[2px] text-[10px] font-semibold text-[#43dbc7]">
      <span className="h-1 w-1 rounded-full bg-[#37d8be]" />
      Active
    </span>
  );
}

function DetailMetric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <div className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#60788c]">
        {label}
      </div>

      <div
        className={`mt-1 text-[12px] font-bold text-[#cadbe7] ${
          mono ? 'font-mono text-[#86c4ec]' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ReviewRow({
  number,
  title,
  meta,
}: {
  number: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[5px] border border-[#223c54] bg-[#102238] px-2.5 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[#1fd2aa]" />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[9px] font-semibold text-[#c4d4e0]">
          {number} · {title}
        </div>

        <div className="mt-0.5 text-[8px] text-[#6c8497]">
          {meta}
        </div>
      </div>

      <span className="rounded-full border border-[#145e5d] bg-[#0b4848]/60 px-2 py-1 text-[8px] font-bold text-[#43dbc7]">
        <Check size={9} className="mr-1 inline" />
        Completed
      </span>
    </div>
  );
}

export default function RepositoryDetails({
  repository,
  onClose,
}: RepositoryDetailsProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020a13]/80 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section
        className="modal-reveal w-full max-w-[482px] overflow-hidden rounded-[8px] border border-[#29455d] bg-[#0c1b2b] shadow-[0_24px_70px_rgba(0,0,0,.48)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repository-details-title"
      >
        <div className="flex items-center gap-3 border-b border-[#20384e] px-4 py-3.5">
          <RepoAvatar repository={repository} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="repository-details-title"
                className="truncate text-[12px] font-bold text-[#d6e4ef]"
              >
                {repository.owner}/{repository.name}
              </h2>

              <StatusPill />
            </div>

            <p className="mt-1 text-[9px] text-[#728a9c]">
              Connected {repository.connected}
              <span className="px-1 text-[#3d586b]">·</span>
              Webhook {repository.webhook.toLowerCase()}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#6a8295] hover:bg-[#183149]"
            aria-label="Close repository details"
          >
            <X size={15} />
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#20384e] border-b border-[#20384e] bg-[#091725]">
          <DetailMetric
            label="Reviews"
            value={String(repository.reviews)}
          />

          <DetailMetric
            label="Last review"
            value={repository.lastReview}
          />

          <DetailMetric
            label="Default branch"
            value={repository.branch}
            mono
          />
        </div>

        <div className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-bold text-[#ccdce8]">
                Recent reviews
              </h3>

              <p className="mt-1 text-[9px] text-[#71899b]">
                A quick look at this repository&apos;s review trail.
              </p>
            </div>

            <button
              type="button"
              className="flex shrink-0 items-center gap-1 rounded border border-[#2b4c66] px-2 py-1.5 text-[9px] font-semibold text-[#91c8ef] hover:bg-[#15324b]"
              onClick={onClose}
            >
              Open activity
              <ExternalLink size={10} />
            </button>
          </div>

          <div className="space-y-2">
            <ReviewRow
              number="#842"
              title="Make webhook retries idempotent"
              meta="8 min ago · Maya Chen"
            />

            <ReviewRow
              number="#839"
              title="Add request signing to partner callbacks"
              meta="Yesterday · Maya Chen"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#20384e] bg-[#091725] px-4 py-2.5">
          <button
            type="button"
            className="flex items-center gap-1 text-[9px] text-[#7fa9c9] hover:text-[#b6d9ef]"
            onClick={() =>
              window.open(
                `https://github.com/${repository.owner}/${repository.name}`,
                '_blank',
                'noopener,noreferrer',
              )
            }
          >
            Open on GitHub
            <ExternalLink size={10} />
          </button>

          <button
            type="button"
            className="rounded-[5px] border border-[#2589df] bg-[#2188df] px-3 py-1.5 text-[10px] font-bold text-[#071522] hover:bg-[#49a5f1]"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}