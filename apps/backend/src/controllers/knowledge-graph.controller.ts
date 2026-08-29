import { NextFunction, Request, Response } from 'express';
import { ConceptExtractionPipeline, GraphSchemaConfig, Neo4jController, RootCauseTraversalAlgorithm } from '../services/knowledge-graph';

export class KnowledgeGraphController {
  private readonly schema = new GraphSchemaConfig();
  private readonly store = new Neo4jController();
  private readonly extractor = new ConceptExtractionPipeline();
  private readonly traversal = new RootCauseTraversalAlgorithm();

  schemaEndpoint(_request: Request, response: Response): void {
    response.json({ cypher: this.schema.buildCypher() });
  }

  ingestConcepts(request: Request, response: Response, next: NextFunction): void {
    try {
      const { text } = request.body as { text?: string };
      if (!text) {
        response.status(400).json({ error: 'text is required' });
        return;
      }

      const result = this.extractor.extractFromText(text);
      const concepts = result.concepts.map((concept, index) => this.store.createConcept({
        id: `concept-${index + 1}`,
        label: concept,
        subject: 'General',
        gradeLevel: '12',
        complexity: 0.5,
        curriculumCode: `GEN-${index + 1}`,
        aliases: result.synonyms.filter((synonym) => synonym.normalized === concept).map((synonym) => synonym.source),
      }));

      response.json({ concepts, result });
    } catch (error) {
      next(error);
    }
  }

  diagnosePrerequisites(request: Request, response: Response): void {
    const { target, graph } = request.body as {
      target?: string;
      graph?: Record<string, string[]>;
    };

    if (!target || !graph) {
      response.status(400).json({ error: 'target and graph are required' });
      return;
    }

    const graphMap = new Map<string, string[]>(Object.entries(graph));
    response.json({ prerequisites: this.traversal.findRootCause(graphMap, target) });
  }
}
