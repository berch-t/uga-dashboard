import { Card } from "@tremor/react";
import { Header } from "@/components/layout/Header";
import { Section } from "@/components/layout/Section";
import { ChartCard } from "@/components/ui/ChartCard";
import { KpiGrid } from "@/components/kpi/KpiGrid";
import { buildKpis } from "@/components/kpi/registry";
import { ProductionTrend, OpenAccessTrend } from "@/components/charts/ProductionCharts";
import { TypeBreakdown, OpenAccessDonut } from "@/components/charts/DistributionCharts";
import { RankedBarList } from "@/components/charts/RankedBarList";
import { CitationDistribution, LotkaChart } from "@/components/charts/ImpactCharts";
import { TopicHeatmap } from "@/components/topics/TopicHeatmap";
import { EmergingTopics } from "@/components/topics/EmergingTopics";
import { CollaborationNetwork } from "@/components/network/CollaborationNetwork";
import { ReconciliationPanel } from "@/components/quality/ReconciliationPanel";
import { PaperExplorer } from "@/components/papers/PaperExplorer";
import { FundingChart } from "@/components/contracts/FundingChart";
import { ContractsTable } from "@/components/contracts/ContractsTable";
import { formatDecimal, formatEur, formatInt } from "@/lib/format";
import {
  authorsMart, bibliometricsMart, contractsMart, manifestMart, networkMart,
  overviewMart, papersMart, reconciliationMart, sourcesMart, topicsMart,
} from "@/lib/marts";

export default function DashboardPage() {
  const kpis = buildKpis({ overview: overviewMart, bibliometrics: bibliometricsMart, network: networkMart, authors: authorsMart });

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
      <Header
        institution={manifestMart.institution.name}
        generatedAt={manifestMart.generatedAt}
        openAlexTotal={manifestMart.sources.openAlex.total}
        halTotal={manifestMart.sources.hal.total}
      />

      <main className="mx-auto max-w-7xl space-y-12 px-6 py-8">
        <Section id="overview" eyebrow="Synthèse" title="Vue d'ensemble"
          description="Indicateurs de tête calculés sur l'intégralité du corpus OpenAlex de l'établissement.">
          <KpiGrid kpis={kpis} />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Évolution de la production" subtitle="Publications par année (corpus complet)">
              <ProductionTrend data={overviewMart.byYear} />
            </ChartCard>
            <ChartCard title="Trajectoire de la science ouverte" subtitle="Part des publications en accès ouvert">
              <OpenAccessTrend data={overviewMart.oaByYear} />
            </ChartCard>
          </div>
        </Section>

        <Section id="production" eyebrow="Production scientifique" title="Composition de la production"
          description="Types de documents harmonisés, voies d'accès ouvert, supports et auteurs les plus actifs.">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Types de documents" subtitle="Taxonomie canonique harmonisée">
              <TypeBreakdown data={overviewMart.typeDistribution} />
            </ChartCard>
            <ChartCard title="Voies de l'accès ouvert" subtitle="Répartition par couleur (OpenAlex)">
              <OpenAccessDonut data={overviewMart.oaDistribution} />
            </ChartCard>
            <ChartCard title="Principaux supports" subtitle="Revues et plateformes les plus fréquentes">
              <RankedBarList data={sourcesMart.topSources.slice(0, 10).map((s) => ({ name: s.name, value: s.count }))} />
            </ChartCard>
            <ChartCard title="Auteurs les plus prolifiques" subtitle="Sur le corpus OpenAlex de l'établissement">
              <RankedBarList color="emerald" data={authorsMart.topAuthors.slice(0, 10).map((a) => ({ name: a.name, value: a.works }))} />
            </ChartCard>
          </div>
        </Section>

        <Section id="impact" eyebrow="Impact & citations" title="Impact scientifique"
          description="Indices bibliométriques reconnus et structure des citations et de la productivité.">
          <div className="grid gap-4 md:grid-cols-3">
            <BiblioCard label="h-index" value={formatInt(bibliometricsMart.hIndex)} basis="Hirsch, 2005" />
            <BiblioCard label="g-index" value={formatInt(bibliometricsMart.gIndex)} basis="Egghe, 2006" />
            <BiblioCard label="i10-index" value={formatInt(bibliometricsMart.i10Index)} basis="≥ 10 citations" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Distribution des citations" subtitle={bibliometricsMart.distributionBasis}>
              <CitationDistribution data={bibliometricsMart.distribution} />
            </ChartCard>
            <ChartCard title="Loi de Lotka" subtitle={`Auteurs par productivité · exposant a = ${formatDecimal(authorsMart.lotka.exponent, 2)} (R² = ${formatDecimal(authorsMart.lotka.r2, 2)})`}>
              <LotkaChart lotka={authorsMart.lotka} />
            </ChartCard>
          </div>
        </Section>

        <Section id="emerging" eyebrow="Signaux faibles" title="Fronts de recherche émergents"
          description="Détection de rafales (Kleinberg, 2002) sur les dynamiques temporelles des thématiques.">
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Dynamique thématique" subtitle="Volume annuel par topic, rafales mises en évidence" className="lg:col-span-2">
              <TopicHeatmap mart={topicsMart} />
            </ChartCard>
            <ChartCard title="Accélérations récentes" subtitle="Topics en rafale sur la période récente">
              <EmergingTopics emerging={topicsMart.emerging} />
            </ChartCard>
          </div>
        </Section>

        <Section id="network" eyebrow="Collaborations" title="Réseau de collaboration institutionnelle"
          description="Co-publications entre institutions partenaires, communautés détectées par l'algorithme de Louvain, disposition ForceAtlas2.">
          <ChartCard title="Graphe de co-publications" subtitle={`${networkMart.nodes.length} institutions · ${networkMart.communities.length} communautés · modularité ${formatDecimal(networkMart.modularity, 2)}`}>
            <CollaborationNetwork data={networkMart} />
          </ChartCard>
        </Section>

        <Section id="contracts" eyebrow="Valorisation & contrats" title="Contrats de recherche financés"
          description="Source : export scanR (financements de la recherche, MESR / data.gouv.fr) ingéré via le connecteur de fichiers internes, projets ayant l'UGA comme partenaire. Couvre les financements compétitifs nationaux et européens (ANR, PIA, H2020, Horizon Europe, FP7…) et illustre le périmètre « valorisation / contrats » de l'offre.">
          <div className="grid gap-4 md:grid-cols-4">
            <BiblioCard label="Projets financés" value={formatInt(contractsMart.totalProjects)} basis="partenaire UGA" />
            <BiblioCard label="Financement UGA cumulé" value={formatEur(contractsMart.totalFundingEur)} basis={`${formatInt(contractsMart.fundedProjects)} projets au montant connu`} />
            <BiblioCard label="Financement moyen" value={formatEur(contractsMart.meanFundingEur)} basis="par projet doté (part UGA)" />
            <BiblioCard label="Période" value={`${contractsMart.period.fromYear}–${contractsMart.period.toYear}`} basis="années de financement" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Financement par année" subtitle="Part UGA attribuée (k€)">
              <FundingChart data={contractsMart.byYear} />
            </ChartCard>
            <ChartCard title="Principaux financeurs" subtitle="Projets par dispositif de financement">
              <RankedBarList color="violet" data={contractsMart.topPrograms.map((p) => ({ name: p.name, value: p.count }))} />
            </ChartCard>
          </div>
          <ChartCard title="Contrats récents" subtitle="Projets récents au financement UGA connu (part la plus élevée en tête)" className="mt-4">
            <ContractsTable rows={contractsMart.recent} />
          </ChartCard>
        </Section>

        <Section id="quality" eyebrow="Qualité des données" title="Réconciliation HAL × OpenAlex"
          description="Fiabilisation et appariement des deux sources ouvertes : recouvrement, méthode d'appariement et écarts de taxonomie.">
          <ChartCard title="Rapport d'appariement" subtitle="Record linkage déterministe (DOI) puis probabiliste (similarité de titre)">
            <ReconciliationPanel data={reconciliationMart} />
          </ChartCard>
        </Section>

        <Section id="explorer" eyebrow="Exploration" title="Explorateur d'articles"
          description="Navigation interactive dans le corpus, en direct via l'API OpenAlex. Cliquez sur une publication pour son détail.">
          <PaperExplorer seed={papersMart.works} />
        </Section>
      </main>

      <Footer generatedAt={manifestMart.generatedAt} fullWorks={manifestMart.corpus.fullWorks} sampleWindow={manifestMart.corpus.sampleWindow} />
    </div>
  );
}

function BiblioCard({ label, value, basis }: { label: string; value: string; basis: string }) {
  return (
    <Card decoration="left" decorationColor="blue">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{basis}</p>
    </Card>
  );
}

function Footer({ generatedAt, fullWorks, sampleWindow }: { generatedAt: string; fullWorks: number; sampleWindow: string }) {
  return (
    <footer className="mx-auto mt-12 max-w-7xl px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-200">Méthodologie & sources</p>
        <p className="mt-2 max-w-3xl leading-relaxed">
          Données réelles, sans aucune donnée fictive. Sources ouvertes : OpenAlex (CC0) et HAL (CCSD).
          Indicateurs de tête sur le corpus complet ({formatInt(fullWorks)} publications) ; analyses par échantillon
          documenté ({sampleWindow}). Algorithmes : Hirsch (h-index), Egghe (g-index), Lotka (productivité),
          Kleinberg (rafales), Blondel/Louvain (communautés), Jacomy/ForceAtlas2 (disposition), record linkage
          Fellegi-Sunter pour la réconciliation. Détails dans <span className="font-mono text-slate-600 dark:text-slate-300">POC.md</span> et
          <span className="font-mono text-slate-600 dark:text-slate-300"> docs/methodology.md</span>.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Démonstration conçue pour l&apos;Université Grenoble Alpes · Thomas Berchet · MIT License ·
          instantané pipeline du {new Date(generatedAt).toLocaleDateString("fr-FR")}.
        </p>
      </div>
    </footer>
  );
}
