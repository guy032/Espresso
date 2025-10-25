/**
 * @swagger
 * /issues:
 *   get:
 *     tags: [Issues]
 *     summary: List all issues with optional filters
 *     description: Retrieve a list of issues with optional filtering, sorting, and pagination
 *     operationId: listIssues
 *     parameters:
 *       - $ref: '#/components/parameters/statusFilter'
 *       - $ref: '#/components/parameters/severityFilter'
 *       - $ref: '#/components/parameters/siteFilter'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/sortField'
 *       - $ref: '#/components/parameters/sortOrder'
 *       - $ref: '#/components/parameters/pageNumber'
 *       - $ref: '#/components/parameters/pageLimit'
 *     responses:
 *       200:
 *         description: List of issues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Issue'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /issues:
 *   post:
 *     tags: [Issues]
 *     summary: Create a new issue
 *     description: Create a new issue in the system
 *     operationId: createIssue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IssueCreateInput'
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /issues/{id}:
 *   get:
 *     tags: [Issues]
 *     summary: Get issue by ID
 *     description: Retrieve a specific issue by its ID
 *     operationId: getIssueById
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     responses:
 *       200:
 *         description: Issue details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /issues/{id}:
 *   put:
 *     tags: [Issues]
 *     summary: Update an issue
 *     description: Update an existing issue by ID
 *     operationId: updateIssue
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IssueUpdateInput'
 *     responses:
 *       200:
 *         description: Issue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /issues/{id}:
 *   delete:
 *     tags: [Issues]
 *     summary: Delete an issue
 *     description: Delete an issue by ID
 *     operationId: deleteIssue
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     responses:
 *       200:
 *         description: Issue deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Issue deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /issues/{id}/resolve:
 *   patch:
 *     tags: [Issues]
 *     summary: Resolve an issue
 *     description: Quick action to set issue status to resolved
 *     operationId: resolveIssue
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     responses:
 *       200:
 *         description: Issue resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     description: Retrieve aggregated counts of issues by status and severity
 *     operationId: getDashboard
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardCounts'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /import/csv:
 *   post:
 *     tags: [Import]
 *     summary: Import issues from CSV file
 *     description: Upload a CSV file to bulk import issues
 *     operationId: importCsv
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with issues data
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Import completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportResult'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

// This file is used by swagger-jsdoc to generate the OpenAPI spec
// The actual route implementations are in the routes directory
