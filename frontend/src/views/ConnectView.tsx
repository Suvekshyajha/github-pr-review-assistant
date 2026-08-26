import { useEffect, useState, type FormEvent } from 'react';
import { Github } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ConnectRepositoryForm from '@/components/repositories/ConnectRepositoryForm';
import ConnectedRepositoryList from '@/components/repositories/ConnectedRepositoryList';
import DisconnectRepositoryDialog from '@/components/repositories/DisconnectRepositoryDialog';
import RepositoryDetails from '@/components/repositories/RepositoryDetails';
import type { Repository } from '@/types/repository';

const STORAGE_KEY = 'pr-review-repositories';

const seededRepositories: Repository[] = [
  {
    id: 'acme-payments-api',
    owner: 'acme',
    name: 'payments-api',
    connected: '12 days ago',
    tone: 'cyan',
    reviews: 2,
    lastReview: '8 min ago',
    branch: 'main',
    webhook: 'Healthy',
  },
  {
    id: 'northstar-labs-checkout-web',
    owner: 'northstar-labs',
    name: 'checkout-web',
    connected: '28 days ago',
    tone: 'violet',
    reviews: 4,
    lastReview: 'Yesterday',
    branch: 'main',
    webhook: 'Healthy',
  },
  {
    id: 'acme-infra-modules',
    owner: 'acme',
    name: 'infra-modules',
    connected: '41 days ago',
    tone: 'amber',
    reviews: 1,
    lastReview: '3 days ago',
    branch: 'main',
    webhook: 'Healthy',
  },
];

export default function ConnectView() {
  const [repositories, setRepositories] = useState<Repository[]>(
    () => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);

        return saved
          ? (JSON.parse(saved) as Repository[])
          : seededRepositories;
      } catch {
        return seededRepositories;
      }
    },
  );

  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [detailsRepository, setDetailsRepository] =
    useState<Repository | null>(null);
  const [disconnectRepository, setDisconnectRepository] =
    useState<Repository | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(repositories),
    );
  }, [repositories]);

  const submitRepository = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedOwner = owner.trim().replace(/^@/, '');
    const normalizedName = name
      .trim()
      .replace(/^\/+|\/+$/g, '');

    if (!normalizedOwner || !normalizedName) {
      setNotice('Enter both an owner and repository name.');
      return;
    }

    if (
      repositories.some(
        (repository) =>
          repository.owner.toLowerCase() ===
            normalizedOwner.toLowerCase() &&
          repository.name.toLowerCase() ===
            normalizedName.toLowerCase(),
      )
    ) {
      setNotice('That repository is already connected.');
      return;
    }

    const nextRepository: Repository = {
      id: `${normalizedOwner}-${normalizedName}-${Date.now()}`,
      owner: normalizedOwner,
      name: normalizedName,
      connected: 'just now',
      tone: ['cyan', 'violet', 'amber'][
        repositories.length % 3
      ] as Repository['tone'],
      reviews: 0,
      lastReview: 'Not yet',
      branch: 'main',
      webhook: 'Healthy',
    };

    setRepositories((current) => [
      nextRepository,
      ...current,
    ]);

    setOwner('');
    setName('');
    setNotice(`${normalizedOwner}/${normalizedName} connected.`);
  };

  const clearOrRestoreRepositories = () => {
    if (repositories.length === 0) {
      setRepositories(seededRepositories);
      setNotice('Seed repositories restored.');
      return;
    }

    setRepositories([]);
    setNotice('Connected repository list cleared.');
  };

  const openOnGitHub = (repository: Repository) => {
    window.open(
      `https://github.com/${repository.owner}/${repository.name}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <AppShell
      mobileOpen={mobileOpen}
      onCloseNavigation={() => setMobileOpen(false)}
      onOpenNavigation={() => setMobileOpen(true)}
      onSettings={() =>
        setNotice('Workspace controls are local to this prototype.')
      }
    >
      <main className="hairline-grid min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8 sm:px-8 md:pt-9">
          <div className="room-reveal">
            <div className="mb-2 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#68869e]">
              <Github size={12} className="text-[#5ba7dc]" />
              Repository access
            </div>

            <h1 className="text-[20px] font-bold text-[#d9e6ef] sm:text-[21px]">
              Connect a Repository
            </h1>

            <p className="mt-1 max-w-[590px] text-[10px] leading-[16px] text-[#72899c] sm:text-[11px]">
              Give the agent a focused place to look. Connect repositories
              individually so review context stays intentional.
            </p>
          </div>

          <ConnectRepositoryForm
            owner={owner}
            name={name}
            notice={notice}
            onOwnerChange={setOwner}
            onNameChange={setName}
            onSubmit={submitRepository}
          />

          <ConnectedRepositoryList
            repositories={repositories}
            onDetails={setDetailsRepository}
            onDisconnect={setDisconnectRepository}
            onOpen={openOnGitHub}
            onClear={clearOrRestoreRepositories}
          />
        </div>
      </main>

      {detailsRepository && (
        <RepositoryDetails
          repository={detailsRepository}
          onClose={() => setDetailsRepository(null)}
        />
      )}

      {disconnectRepository && (
        <DisconnectRepositoryDialog
          repository={disconnectRepository}
          onCancel={() => setDisconnectRepository(null)}
          onConfirm={() => {
            setRepositories((current) =>
              current.filter(
                (repository) =>
                  repository.id !== disconnectRepository.id,
              ),
            );

            setDisconnectRepository(null);

            setNotice(
              `${disconnectRepository.owner}/${disconnectRepository.name} disconnected.`,
            );
          }}
        />
      )}
    </AppShell>
  );
}