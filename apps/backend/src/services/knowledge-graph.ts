export interface GraphConceptNode {
  id: string;
  label: string;
  subject: string;
  gradeLevel: string;
  complexity: number;
  curriculumCode: string;
  aliases: string[];
  localizedLabels?: Record<string, string>;
  status?: 'MASTERED' | 'WEAK' | 'UNLEARNED';
}

export type GraphRelationshipType =
  | 'PREREQUISITE_OF'
  | 'PART_OF'
  | 'CROSS_APPLIED_TO'
  | 'LEADS_TO_MISCONCEPTION';

export interface GraphRelationship {
  from: string;
  to: string;
  type: GraphRelationshipType;
}

export class GraphSchemaConfig {
  buildCypher(): string {
    return [
      'CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (n:Concept) REQUIRE n.id IS UNIQUE;',
      'CREATE CONSTRAINT subject_code IF NOT EXISTS FOR (s:Subject) REQUIRE s.code IS UNIQUE;',
      'CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (k:Skill) REQUIRE k.id IS UNIQUE;',
      '',
      'CREATE (:Concept {id: $id, label: $label, subject: $subject, gradeLevel: $gradeLevel, complexity: $complexity, curriculumCode: $curriculumCode, aliases: $aliases})',
      'CREATE (:Subject {id: $id, code: $code, label: $label, locale: $locale})',
      'CREATE (:GradeLevel {id: $id, level: $level, label: $label})',
      'MATCH (a:Concept {id: $fromId}), (b:Concept {id: $toId}) CREATE (a)-[:PREREQUISITE_OF]->(b);',
      'MATCH (a:Concept {id: $fromId}), (b:Concept {id: $toId}) CREATE (a)-[:CROSS_APPLIED_TO]->(b);',
    ].join('\n');
  }
}

export class Neo4jController {
  private readonly nodes = new Map<string, GraphConceptNode>();
  private readonly edges: GraphRelationship[] = [];

  createConcept(node: GraphConceptNode): GraphConceptNode {
    const normalizedNode: GraphConceptNode = {
      ...node,
      aliases: [...new Set(node.aliases ?? [])],
      localizedLabels: node.localizedLabels ?? {
        vi: node.label,
        en: node.label,
      },
    };

    this.nodes.set(node.id, normalizedNode);
    return { ...normalizedNode };
  }

  createRelationship(from: string, to: string, type: GraphRelationshipType = 'PREREQUISITE_OF'): GraphRelationship {
    const relationship: GraphRelationship = { from, to, type };
    this.edges.push(relationship);
    return relationship;
  }

  getConcept(id: string): GraphConceptNode | undefined {
    return this.nodes.get(id);
  }

  getRelationships(): GraphRelationship[] {
    return [...this.edges];
  }

  getAllConcepts(): GraphConceptNode[] {
    return [...this.nodes.values()];
  }

  mergeSynonym(input: GraphConceptNode, alias: string): GraphConceptNode {
    const existing = this.nodes.get(input.id) ?? input;
    const aliasSet = new Set(existing.aliases);
    aliasSet.add(alias);
    const updated = { ...existing, aliases: [...aliasSet] };
    this.nodes.set(existing.id, updated);
    return { ...updated };
  }
}

export interface ConceptExtractionResult {
  concepts: string[];
  synonyms: Array<{ source: string; normalized: string }>;
  prerequisites: string[];
}

export class ConceptExtractionPipeline {
  private readonly canonicalConcepts = new Map<string, string[]>([
    ['quadratic_equation', ['quadratic equation', 'phương trình bậc 2', 'quadratic equation']],
    ['derivative', ['derivative', 'đạo hàm', 'đạo hàm hợp']],
    ['newton_second_law', ['newton 2', 'định luật newton 2', 'newton second law']],
    ['simple_past_tense', ['simple past tense', 'thì quá khứ đơn', 'past tense']],
  ]);

  normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s_]+/g, '')
      .trim()
      .replace(/\s+/g, '_');
  }

  extractFromText(text: string): ConceptExtractionResult {
    const foundConcepts = new Set<string>();
    const synonyms: Array<{ source: string; normalized: string }> = [];
    const prerequisites = new Set<string>();

    for (const [normalized, aliases] of this.canonicalConcepts.entries()) {
      for (const alias of aliases) {
        const candidate = this.normalize(alias);
        if (text.toLowerCase().includes(alias.toLowerCase()) || text.toLowerCase().includes(candidate.replace(/_/g, ' '))) {
          foundConcepts.add(normalized);
          synonyms.push({ source: alias, normalized });
          if (normalized === 'quadratic_equation') {
            prerequisites.add('basic_algebra');
          }
          if (normalized === 'derivative') {
            prerequisites.add('function_rules');
          }
        }
      }
    }

    if (foundConcepts.size === 0) {
      const fallbackMatches = text.match(/([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s]{2,})/g) ?? [];
      for (const match of fallbackMatches.slice(0, 3)) {
        const normalized = this.normalize(match);
        if (normalized) {
          foundConcepts.add(normalized);
          synonyms.push({ source: match, normalized });
        }
      }
    }

    const conceptList = [...foundConcepts];
    return {
      concepts: conceptList,
      synonyms,
      prerequisites: [...prerequisites],
    };
  }
}

export class RootCauseTraversalAlgorithm {
  findRootCause(graph: Map<string, string[]>, target: string): string[] {
    const results: string[] = [];
    const visited = new Set<string>();

    const walk = (current: string): void => {
      if (visited.has(current)) return;
      visited.add(current);
      const dependencies = graph.get(current) ?? [];

      for (const dependency of dependencies) {
        results.push(dependency);
        walk(dependency);
      }
    };

    walk(target);
    return [...new Set(results)];
  }
}
