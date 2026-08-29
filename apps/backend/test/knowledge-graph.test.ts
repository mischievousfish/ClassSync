import { GraphSchemaConfig, Neo4jController, ConceptExtractionPipeline, RootCauseTraversalAlgorithm } from '../src/services/knowledge-graph';

describe('ClassSync knowledge graph', () => {
  it('creates a valid graph schema with prerequisite relationships', () => {
    const schema = new GraphSchemaConfig();
    const cypher = schema.buildCypher();

    expect(cypher).toContain('CREATE CONSTRAINT');
    expect(cypher).toContain('PREREQUISITE_OF');
    expect(cypher).toContain('Concept');
  });

  it('normalizes concept synonyms and extracts prerequisite candidates', () => {
    const pipeline = new ConceptExtractionPipeline();
    const result = pipeline.extractFromText('Quadratic Equation and Phương trình bậc 2 are linked to solving systems.');

    expect(result.concepts.length).toBeGreaterThan(0);
    expect(result.synonyms.some((entry) => entry.normalized === 'quadratic_equation')).toBe(true);
    expect(result.prerequisites.length).toBeGreaterThan(0);
  });

  it('finds the root-cause prerequisite chain for a failing concept', () => {
    const algorithm = new RootCauseTraversalAlgorithm();
    const graph = new Map<string, string[]>([
      ['đạo_hàm_hợp', ['đạo_hàm', 'phép_thế_đại_số']],
      ['tích_phân_hàm_ẩn', ['đạo_hàm_hợp', 'phép_thế_đại_số']],
      ['phương_trình_bậc_2', ['đại_số_cơ_bản']],
    ]);

    const chain = algorithm.findRootCause(graph, 'tích_phân_hàm_ẩn');
    expect(chain).toContain('đạo_hàm_hợp');
    expect(chain).toContain('phép_thế_đại_số');
  });

  it('routes graph mutations through the controller with stable IDs', () => {
    const controller = new Neo4jController();
    const node = controller.createConcept({
      id: 'node-1',
      label: 'Đạo hàm',
      subject: 'Toán',
      gradeLevel: '12',
      complexity: 0.82,
      curriculumCode: 'MATH-12-01',
      aliases: ['Derivative'],
    });

    expect(node.id).toBe('node-1');
    expect(node.label).toBe('Đạo hàm');
    expect(node.aliases).toContain('Derivative');
  });
});
