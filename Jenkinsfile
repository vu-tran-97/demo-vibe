pipeline {
    agent any

    environment {
        RAILWAY_TOKEN = credentials('railway-token')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Frontend') {
                    steps {
                        sh 'npm ci'
                    }
                }
                stage('Backend') {
                    steps {
                        dir('server') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }

        stage('Lint') {
            parallel {
                stage('Frontend Lint') {
                    steps {
                        sh 'npm run lint || true'
                    }
                }
                stage('Backend Lint') {
                    steps {
                        dir('server') {
                            sh 'npx tsc --noEmit || true'
                        }
                    }
                }
            }
        }

        stage('Test') {
            steps {
                dir('server') {
                    sh 'npm run test -- --passWithNoTests --forceExit'
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('server') {
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Deploy to Railway') {
            when {
                branch 'staging'
            }
            steps {
                echo 'Deploying to Railway staging...'
                sh 'railway up --detach'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished'
            cleanWs(
                cleanWhenNotBuilt: false,
                deleteDirs: true,
                patterns: [
                    [pattern: 'node_modules/**', type: 'INCLUDE'],
                    [pattern: 'server/node_modules/**', type: 'INCLUDE'],
                    [pattern: '.next/**', type: 'INCLUDE'],
                    [pattern: 'server/dist/**', type: 'INCLUDE']
                ]
            )
        }
        success {
            echo 'Build & Deploy successful!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
