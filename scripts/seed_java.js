import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Automatically load .env.local or .env if environment variables are not yet populated
function loadEnv() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ];

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      if (typeof process.loadEnvFile === 'function') {
        try {
          process.loadEnvFile(envPath);
          break;
        } catch {
          // fallback to manual parse if loadEnvFile fails
        }
      }
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            // Remove wrapping quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch (err) {
        console.warn(`Could not read ${envPath}:`, err.message);
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use the service role key to bypass RLS during seeding. Fallback to anon key.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// Subject & Quiz Dataset Definitions
// ==========================================

const javaProgrammingData = {
  subject: {
    title: 'Java Programming',
    description: 'Master object-oriented programming concepts and core Java APIs.',
  },
  quizzes: [
    {
      title: 'Java Basics',
      description: 'Test your knowledge on basic syntax, variables, and data types.',
      time_limit: 10,
      questions: [
        { question_text: "Which of the following is not a Java feature?", options: ["Object-oriented", "Use of pointers", "Portable", "Dynamic"], correct_option_index: 1 },
        { question_text: "What is the size of an int variable?", options: ["8 bit", "16 bit", "32 bit", "64 bit"], correct_option_index: 2 },
        { question_text: "What is the default value of a boolean variable?", options: ["true", "false", "null", "0"], correct_option_index: 1 },
        { question_text: "Which keyword is used to define a constant in Java?", options: ["const", "final", "static", "constant"], correct_option_index: 1 },
        { question_text: "What is the entry point of a Java program?", options: ["start()", "init()", "main()", "run()"], correct_option_index: 2 },
        { question_text: "Which of the following loops guarantees execution at least once?", options: ["for", "while", "do-while", "forEach"], correct_option_index: 2 },
        { question_text: "In Java, arrays are:", options: ["Objects", "Object references", "Primitive data types", "None of the above"], correct_option_index: 0 },
        { question_text: "Which operator is used to allocate memory for an object?", options: ["malloc", "alloc", "new", "give"], correct_option_index: 2 },
        { question_text: "What does JVM stand for?", options: ["Java Variable Machine", "Java Virtual Machine", "Java Vital Machine", "Java Visual Machine"], correct_option_index: 1 },
        { question_text: "Which data type is used to create a variable that should store text?", options: ["String", "string", "Txt", "myString"], correct_option_index: 0 }
      ]
    },
    {
      title: 'Object-Oriented Java',
      description: 'Deep dive into classes, inheritance, polymorphism, and encapsulation.',
      time_limit: 15,
      questions: [
        { question_text: "What is encapsulation in Java?", options: ["Hiding implementation details", "Creating new classes", "Inheriting properties", "Method overloading"], correct_option_index: 0 },
        { question_text: "Which keyword is used for inheritance in Java?", options: ["inherits", "extends", "implements", "super"], correct_option_index: 1 },
        { question_text: "A class that cannot be instantiated is called:", options: ["Final class", "Static class", "Abstract class", "Private class"], correct_option_index: 2 },
        { question_text: "Which of the following is true about constructors?", options: ["They have a return type", "They can be static", "Their name matches the class name", "They cannot be overloaded"], correct_option_index: 2 },
        { question_text: "Method overriding is an example of:", options: ["Static polymorphism", "Compile-time polymorphism", "Dynamic/Runtime polymorphism", "Encapsulation"], correct_option_index: 2 },
        { question_text: "Which keyword prevents a method from being overridden?", options: ["static", "final", "const", "abstract"], correct_option_index: 1 },
        { question_text: "Can a class implement multiple interfaces?", options: ["Yes", "No", "Only if they are abstract", "Only in Java 8+"], correct_option_index: 0 },
        { question_text: "What does the 'super' keyword refer to?", options: ["Current class object", "Parent class object", "Child class object", "Static method"], correct_option_index: 1 },
        { question_text: "Which of these access specifiers allows visibility everywhere?", options: ["private", "protected", "default", "public"], correct_option_index: 3 },
        { question_text: "What is a 'POJO'?", options: ["Plain Old Java Object", "Public Object Java Oriented", "Private Object Java Order", "Plain Ordered Java Object"], correct_option_index: 0 }
      ]
    }
  ]
};

const computerSimulationData = {
  subject: {
    title: 'Computer Simulation and Modelling',
    description: 'Master discrete-event simulation, continuous system dynamics, Monte Carlo analysis, and queuing theory.',
  },
  quizzes: [
    {
      title: 'Simulation Fundamentals & Models',
      description: 'Test your understanding of simulation paradigms, state variables, event-driven architectures, and model validation.',
      time_limit: 10,
      questions: [
        {
          question_text: "What is the primary difference between a continuous model and a discrete-event model?",
          options: [
            "State variables change continuously over time in continuous models and at discrete points in time in discrete models",
            "Continuous models run only on supercomputers while discrete models run on microcontrollers",
            "Discrete models cannot represent time or state variables",
            "Continuous models only use discrete uniform random numbers"
          ],
          correct_option_index: 0
        },
        {
          question_text: "In simulation modelling, what does the 'system state' represent?",
          options: [
            "The geographical server location hosting the simulation engine",
            "A collection of variables necessary to describe the system at any given point in time",
            "The specific programming framework used to construct the model",
            "The hardware memory allocated by the operating system"
          ],
          correct_option_index: 1
        },
        {
          question_text: "What defines an 'event' in discrete-event simulation (DES)?",
          options: [
            "A continuous background thread that monitors CPU usage",
            "An instantaneous occurrence that may alter the state of the system",
            "A user interaction callback in the front-end user interface",
            "A fatal software exception halting the simulation run"
          ],
          correct_option_index: 1
        },
        {
          question_text: "Which statement best describes 'Model Verification'?",
          options: [
            "Ensuring the conceptual model is correctly implemented and programmed (building the model right)",
            "Comparing simulation outputs against real-world observational data (building the right model)",
            "Evaluating user feedback and UI design choices",
            "Validating the software licensing and cryptographic keys"
          ],
          correct_option_index: 0
        },
        {
          question_text: "Which statement best describes 'Model Validation'?",
          options: [
            "Eliminating compiler syntax errors and unit test warnings",
            "Determining whether the model accurately represents the intended real-world system (building the right model)",
            "Verifying that the pseudo-random generator is initialized with seed zero",
            "Profiling the execution speed and instruction cache misses"
          ],
          correct_option_index: 1
        },
        {
          question_text: "What data structure is standard for managing scheduled events in a discrete-event simulation engine?",
          options: [
            "Priority Queue / Future Event List (FEL)",
            "First-In Last-Out (FILO) Stack",
            "Unordered cyclic linked list",
            "Hash table with non-sequential keys"
          ],
          correct_option_index: 0
        },
        {
          question_text: "Which of the following characterizes a static simulation model?",
          options: [
            "Time is an explicit variable that continuously advances",
            "It represents a system at a particular point in time without time progression",
            "Events must be processed strictly based on a hardware clock",
            "It must be governed by higher-order partial differential equations"
          ],
          correct_option_index: 1
        },
        {
          question_text: "In simulation analysis, what does 'transient behavior' describe?",
          options: [
            "The long-run steady-state equilibrium of the system",
            "The initial warm-up period before the system stabilizes into steady-state operation",
            "A memory leak that occurs after thousands of iterations",
            "Unexpected boundary overflow in random variate sampling"
          ],
          correct_option_index: 1
        },
        {
          question_text: "Which technique is commonly applied to eliminate initialization bias in steady-state simulations?",
          options: [
            "Warm-up period / truncation of initial transient observations",
            "Randomizing the seed before every single event",
            "Setting server queue capacities to infinity",
            "Restricting the experiment to exactly one replication"
          ],
          correct_option_index: 0
        },
        {
          question_text: "What characterizes a deterministic simulation model?",
          options: [
            "It incorporates probability distributions and random variates",
            "It contains no random variables and always yields identical results for given inputs",
            "It can only be executed once because state is permanently altered",
            "It must use Monte Carlo numerical approximations"
          ],
          correct_option_index: 1
        }
      ]
    },
    {
      title: 'Monte Carlo & Queuing Techniques',
      description: 'Explore pseudo-random variate generation, Monte Carlo simulations, Kendall notation, and queuing networks.',
      time_limit: 15,
      questions: [
        {
          question_text: "What is the core principle behind the Monte Carlo method?",
          options: [
            "Using repeated random sampling to compute numerical approximations for complex problems",
            "Solving differential equations strictly through symbolic calculus",
            "Employing divide-and-conquer sorting to minimize compute time",
            "Executing parallel render pipelines on dedicated GPUs"
          ],
          correct_option_index: 0
        },
        {
          question_text: "Which statistical test is standard for validating the uniformity and independence of pseudo-random numbers?",
          options: [
            "Kolmogorov-Smirnov (K-S) or Chi-Square Goodness-of-Fit test",
            "Dijkstra shortest path algorithm",
            "QuickSort comparison pass",
            "Breadth-first search traversal"
          ],
          correct_option_index: 0
        },
        {
          question_text: "In Kendall's notation for queuing systems (A/B/c), what does the symbol 'M' indicate?",
          options: [
            "Maximum capacity limit",
            "Markovian / Exponential distribution (Poisson arrival or service process)",
            "Multi-threaded concurrent execution",
            "Manual deterministic service timing"
          ],
          correct_option_index: 1
        },
        {
          question_text: "According to Little's Law in queuing theory, which equation relates average items in system (L), arrival rate (λ), and average time in system (W)?",
          options: [
            "L = λ × W",
            "L = λ / W",
            "W = L × λ",
            "L = λ + W"
          ],
          correct_option_index: 0
        },
        {
          question_text: "What recurrence relation defines a Linear Congruential Generator (LCG)?",
          options: [
            "X_(n+1) = (a × X_n + c) mod m",
            "X_(n+1) = (X_n)^2 + c",
            "X_(n+1) = (a / X_n) mod m",
            "X_(n+1) = √(X_n × m)"
          ],
          correct_option_index: 0
        },
        {
          question_text: "In an M/M/1 queuing system, what condition is required for steady-state equilibrium (stability)?",
          options: [
            "Traffic intensity ρ = λ / μ < 1",
            "Arrival rate λ must exceed service rate μ",
            "Total queue length must be capped at 10 items",
            "Service time variance must equal infinity"
          ],
          correct_option_index: 0
        },
        {
          question_text: "What is the primary function of the Inverse-Transform Method in simulation?",
          options: [
            "Generating random variates from an arbitrary continuous distribution using standard uniform U(0,1) numbers",
            "Reversing a completed simulation timeline back to step zero",
            "Decrypting obfuscated pseudo-random seeds",
            "Converting sparse state matrices into continuous signals"
          ],
          correct_option_index: 0
        },
        {
          question_text: "Why are independent replications executed when running stochastic simulations?",
          options: [
            "To estimate sample variance and construct valid confidence intervals for output metrics",
            "Because CPU registers need multiple warm-up cycles before reaching peak accuracy",
            "To guarantee that random number generators do not repeat cycles",
            "To compress the memory footprint of system state logs"
          ],
          correct_option_index: 0
        },
        {
          question_text: "In continuous system simulation, which numerical method is commonly used for solving ordinary differential equations (ODEs)?",
          options: [
            "Runge-Kutta 4th Order method (RK4)",
            "Bubble Sort algorithm",
            "Huffman coding tree",
            "Floyd-Warshall algorithm"
          ],
          correct_option_index: 0
        },
        {
          question_text: "Which variance reduction technique uses negatively correlated pairs of random inputs to reduce output estimator variance?",
          options: [
            "Antithetic Variates",
            "Importance Sampling",
            "Common Random Numbers only",
            "Stratified Partitioning"
          ],
          correct_option_index: 0
        }
      ]
    }
  ]
};

// ==========================================
// Data Mining
// ==========================================

const dataMiningData = {
  subject: {
    title: 'Data Mining',
    description: 'Discover patterns and extract knowledge from large datasets using classification, clustering, association rules, and preprocessing techniques.',
  },
  quizzes: [
    {
      title: 'Data Mining Fundamentals',
      description: 'Fundamental concepts of data mining, KDD process, and basic terminology.',
      time_limit: 10,
      questions: [
        { question_text: "What does KDD stand for?", options: ["Knowledge Discovery in Databases", "Key Data Distribution", "Kernel Data Design", "Knowledge Driven Data"], correct_option_index: 0 },
        { question_text: "Which of the following is a supervised learning technique?", options: ["K-Means Clustering", "Classification", "Apriori Algorithm", "DBSCAN"], correct_option_index: 1 },
        { question_text: "What is the first step of the KDD process?", options: ["Data Mining", "Data Selection", "Data Cleaning", "Evaluation"], correct_option_index: 1 },
        { question_text: "Which type of attribute has a finite set of values with no ordering?", options: ["Ordinal", "Nominal", "Interval", "Ratio"], correct_option_index: 1 },
        { question_text: "What does a decision tree use to classify data?", options: ["Clusters", "If-then rules based on attributes", "Neural layers", "Regression lines"], correct_option_index: 1 },
        { question_text: "Which of the following is an example of unsupervised learning?", options: ["Decision Trees", "Naive Bayes", "Clustering", "Linear Regression"], correct_option_index: 2 },
        { question_text: "What is 'noise' in the context of data mining?", options: ["Useful hidden patterns", "Random errors or variance in data", "Missing attribute values", "Encrypted data fields"], correct_option_index: 1 },
        { question_text: "Which measure indicates how often items appear together in transactions?", options: ["Confidence", "Lift", "Support", "Entropy"], correct_option_index: 2 },
        { question_text: "What is the purpose of data preprocessing?", options: ["To visualize final results", "To clean, integrate, and transform raw data for mining", "To encrypt sensitive information", "To split data into training and deployment sets only"], correct_option_index: 1 },
        { question_text: "Which algorithm is commonly used for association rule mining?", options: ["K-Nearest Neighbors", "Apriori", "SVM", "Random Forest"], correct_option_index: 1 }
      ]
    },
    {
      title: 'Classification & Clustering',
      description: 'Classification algorithms, evaluation metrics, and clustering techniques.',
      time_limit: 15,
      questions: [
        { question_text: "In a decision tree, which metric measures the impurity of a node?", options: ["Support", "Gini Index", "Lift", "Recall"], correct_option_index: 1 },
        { question_text: "What is 'overfitting' in a classification model?", options: ["The model performs well on both training and test data", "The model captures noise and performs poorly on unseen data", "The model is too simple to capture patterns", "The model has high bias"], correct_option_index: 1 },
        { question_text: "What does the 'confidence' of an association rule X → Y represent?", options: ["P(X ∪ Y)", "P(Y | X)", "P(X | Y)", "P(X) × P(Y)"], correct_option_index: 1 },
        { question_text: "Which clustering algorithm requires specifying the number of clusters k in advance?", options: ["DBSCAN", "Hierarchical Agglomerative", "K-Means", "OPTICS"], correct_option_index: 2 },
        { question_text: "What is the purpose of a confusion matrix?", options: ["To visualize cluster centroids", "To evaluate the performance of a classification model", "To compute association rules", "To normalize input features"], correct_option_index: 1 },
        { question_text: "Which technique reduces the number of attributes while preserving data variance?", options: ["Normalization", "Principal Component Analysis (PCA)", "Binning", "Apriori pruning"], correct_option_index: 1 },
        { question_text: "In Naive Bayes classification, what key assumption is made?", options: ["All attributes are correlated", "Features are conditionally independent given the class", "Prior probabilities are always equal", "Only numerical features can be used"], correct_option_index: 1 },
        { question_text: "What does DBSCAN use to define clusters?", options: ["Centroids and distances", "Density of points within a radius (eps) and minimum points (minPts)", "Information gain splits", "Hierarchical dendrograms"], correct_option_index: 1 },
        { question_text: "Precision in classification is defined as:", options: ["TP / (TP + FN)", "TP / (TP + FP)", "TN / (TN + FP)", "(TP + TN) / Total"], correct_option_index: 1 },
        { question_text: "What is 'pruning' in the context of decision trees?", options: ["Adding more branches to increase accuracy", "Removing branches that contribute to overfitting", "Merging leaf nodes of different classes", "Randomizing split criteria"], correct_option_index: 1 }
      ]
    },
    {
      title: 'Advanced Mining & Ensembles',
      description: 'Advanced topics including ensemble methods, outlier detection, and mining complex data.',
      time_limit: 20,
      questions: [
        { question_text: "In the FP-Growth algorithm, what structure is used to compress the transaction database?", options: ["Decision Tree", "FP-Tree (Frequent Pattern Tree)", "B+ Tree", "Hash Table"], correct_option_index: 1 },
        { question_text: "Which ensemble technique builds multiple models sequentially, each correcting errors of the previous?", options: ["Bagging", "Boosting", "Stacking", "Random Subspace"], correct_option_index: 1 },
        { question_text: "What is the Curse of Dimensionality?", options: ["Algorithms become slower with more training samples", "As dimensions increase, data becomes sparse making distance metrics less meaningful", "High dimensional data always leads to underfitting", "Clustering becomes faster in higher dimensions"], correct_option_index: 1 },
        { question_text: "In hierarchical clustering, what does a dendrogram represent?", options: ["The decision boundaries of a classifier", "A tree-like diagram showing nested groupings and merge distances", "The principal components of the data", "The frequency distribution of attributes"], correct_option_index: 1 },
        { question_text: "What does the 'lift' of an association rule measure?", options: ["The absolute frequency of the rule", "How much more likely Y is given X compared to Y's baseline probability", "The number of transactions containing X", "The entropy reduction after applying the rule"], correct_option_index: 1 },
        { question_text: "Which method detects outliers by measuring the local density deviation of a data point with respect to its neighbors?", options: ["Z-Score method", "IQR method", "Local Outlier Factor (LOF)", "Mahalanobis Distance"], correct_option_index: 2 },
        { question_text: "In Random Forest, what two sources of randomness are introduced?", options: ["Random learning rate and random epochs", "Bootstrap sampling of data and random subset of features at each split", "Random initialization of weights and biases", "Random pruning depth and random impurity threshold"], correct_option_index: 1 },
        { question_text: "What is the Silhouette Coefficient used for?", options: ["Measuring classification accuracy", "Evaluating how well-separated and cohesive clusters are", "Computing the support of frequent itemsets", "Determining the optimal learning rate"], correct_option_index: 1 },
        { question_text: "In text mining, what does TF-IDF measure?", options: ["The total frequency of all terms in a corpus", "How important a word is to a document relative to the entire corpus", "The grammatical correctness of sentences", "The compression ratio of a document"], correct_option_index: 1 },
        { question_text: "Which technique addresses class imbalance by generating synthetic minority class samples?", options: ["Undersampling", "SMOTE (Synthetic Minority Oversampling Technique)", "Feature Selection", "Cross-Validation"], correct_option_index: 1 }
      ]
    }
  ]
};

// ==========================================
// Machine Learning
// ==========================================

const machineLearningData = {
  subject: {
    title: 'Machine Learning',
    description: 'Understand supervised, unsupervised, and reinforcement learning algorithms along with model evaluation and optimization.',
  },
  quizzes: [
    {
      title: 'Machine Learning Basics',
      description: 'Basic concepts, types of learning, and introductory algorithms.',
      time_limit: 10,
      questions: [
        { question_text: "What is machine learning?", options: ["A branch of AI that enables systems to learn from data", "A method of manually programming every decision", "A hardware optimization technique", "A database management system"], correct_option_index: 0 },
        { question_text: "Which type of learning uses labeled data?", options: ["Unsupervised Learning", "Reinforcement Learning", "Supervised Learning", "Self-supervised Learning"], correct_option_index: 2 },
        { question_text: "What is a 'feature' in machine learning?", options: ["The target variable to predict", "An individual measurable property of the data", "The output of the model", "A type of neural network layer"], correct_option_index: 1 },
        { question_text: "Linear regression is used for:", options: ["Classification tasks", "Predicting continuous numerical values", "Clustering data points", "Dimensionality reduction"], correct_option_index: 1 },
        { question_text: "What is the purpose of a training set?", options: ["To evaluate the final model performance", "To teach the model patterns from labeled examples", "To tune hyperparameters", "To deploy the model in production"], correct_option_index: 1 },
        { question_text: "Which algorithm classifies a data point based on the majority class of its nearest neighbors?", options: ["Decision Tree", "K-Nearest Neighbors (KNN)", "Linear Regression", "Naive Bayes"], correct_option_index: 1 },
        { question_text: "What is a 'label' in supervised learning?", options: ["A feature of the input data", "The known output or target value for a training example", "The name of the algorithm used", "The weight assigned to a neuron"], correct_option_index: 1 },
        { question_text: "Which of the following is an example of a classification problem?", options: ["Predicting house prices", "Grouping customers by behavior", "Detecting spam emails", "Forecasting stock prices"], correct_option_index: 2 },
        { question_text: "What does 'training a model' mean?", options: ["Writing the code for the algorithm", "Adjusting model parameters to minimize error on training data", "Collecting and cleaning data", "Deploying the model to a server"], correct_option_index: 1 },
        { question_text: "What is overfitting?", options: ["The model generalizes well to new data", "The model is too simple to capture patterns", "The model memorizes training data and performs poorly on new data", "The model has too few parameters"], correct_option_index: 2 }
      ]
    },
    {
      title: 'Supervised Models & Tuning',
      description: 'Regularization, model evaluation, SVMs, and ensemble methods.',
      time_limit: 15,
      questions: [
        { question_text: "What is the bias-variance tradeoff?", options: ["Choosing between accuracy and speed", "Balancing model simplicity (bias) against sensitivity to training data (variance)", "Trading off training time for prediction time", "Selecting between supervised and unsupervised learning"], correct_option_index: 1 },
        { question_text: "What does L2 regularization (Ridge Regression) add to the loss function?", options: ["Sum of absolute values of weights", "Sum of squared values of weights", "Logarithm of weights", "Product of all weights"], correct_option_index: 1 },
        { question_text: "In k-fold cross-validation, what happens?", options: ["The data is split into k parts; each part serves as a test set once while the rest train the model", "The model is trained k times on the full dataset", "Only k features are selected for training", "The learning rate is divided by k"], correct_option_index: 0 },
        { question_text: "What is the kernel trick in SVMs?", options: ["A method to speed up training time", "Mapping data to a higher-dimensional space to find a linear separator without explicit transformation", "Reducing the number of support vectors", "A regularization technique"], correct_option_index: 1 },
        { question_text: "What does the ROC curve plot?", options: ["Precision vs Recall", "True Positive Rate vs False Positive Rate at various thresholds", "Training error vs Validation error", "Bias vs Variance"], correct_option_index: 1 },
        { question_text: "What is the role of the learning rate in gradient descent?", options: ["It determines the number of features", "It controls the step size of parameter updates toward the minimum", "It sets the number of epochs", "It defines the model architecture"], correct_option_index: 1 },
        { question_text: "Which technique combines predictions of multiple weak learners to create a strong learner?", options: ["Feature Engineering", "Ensemble Learning", "Transfer Learning", "Data Augmentation"], correct_option_index: 1 },
        { question_text: "What is the F1-Score?", options: ["The accuracy of the model", "The harmonic mean of precision and recall", "The geometric mean of bias and variance", "The ratio of TP to total predictions"], correct_option_index: 1 },
        { question_text: "What is the purpose of a validation set?", options: ["To train the model", "To tune hyperparameters and prevent overfitting during development", "To serve as the final test of model performance", "To augment the training data"], correct_option_index: 1 },
        { question_text: "In logistic regression, what function maps outputs to probabilities?", options: ["ReLU", "Softmax", "Sigmoid (Logistic) function", "Tanh"], correct_option_index: 2 }
      ]
    },
    {
      title: 'Neural Networks & Deep Learning',
      description: 'Neural networks, gradient optimization, generative models, and advanced theory.',
      time_limit: 20,
      questions: [
        { question_text: "What problem does the vanishing gradient address in deep networks?", options: ["Weights grow too large during training", "Gradients become extremely small in early layers, stalling learning", "The model converges too quickly", "Too many neurons are activated simultaneously"], correct_option_index: 1 },
        { question_text: "What is the VC (Vapnik-Chervonenkis) dimension?", options: ["The number of layers in a neural network", "A measure of the capacity/complexity of a model class (largest set it can shatter)", "The variance of the cross-validation score", "The dimensionality of the input space"], correct_option_index: 1 },
        { question_text: "In a GAN (Generative Adversarial Network), what do the generator and discriminator do?", options: ["Both try to classify input data", "Generator creates fake data; discriminator distinguishes real from fake", "Generator compresses data; discriminator decompresses it", "Both are trained on labeled data to maximize accuracy"], correct_option_index: 1 },
        { question_text: "What is the difference between batch gradient descent and stochastic gradient descent (SGD)?", options: ["Batch uses all training samples per update; SGD uses one (or a mini-batch)", "SGD always converges faster", "Batch gradient descent is only for unsupervised learning", "There is no difference"], correct_option_index: 0 },
        { question_text: "What is dropout regularization in neural networks?", options: ["Removing low-importance features before training", "Randomly deactivating a fraction of neurons during training to prevent co-adaptation", "Stopping training after a fixed number of epochs", "Reducing the learning rate over time"], correct_option_index: 1 },
        { question_text: "What does the Adam optimizer combine?", options: ["L1 and L2 regularization", "Momentum and RMSProp (adaptive learning rates with momentum)", "Batch normalization and dropout", "Early stopping and learning rate scheduling"], correct_option_index: 1 },
        { question_text: "In reinforcement learning, what does the Bellman equation express?", options: ["The relationship between the value of a state and the values of successor states", "The gradient of the loss function", "The probability distribution of actions", "The entropy of the reward signal"], correct_option_index: 0 },
        { question_text: "What is the purpose of batch normalization?", options: ["To increase batch size during training", "To normalize layer inputs, stabilizing and accelerating training", "To select the best batch of training examples", "To convert categorical features to numerical"], correct_option_index: 1 },
        { question_text: "What is transfer learning?", options: ["Moving data between databases", "Using a model trained on one task as the starting point for a different but related task", "Training a model on multiple GPUs simultaneously", "Transferring features from test set to training set"], correct_option_index: 1 },
        { question_text: "What is the 'No Free Lunch' theorem in machine learning?", options: ["All algorithms have equal computational cost", "No single algorithm works best for every possible problem", "Free parameters always lead to overfitting", "Unsupervised learning is always worse than supervised learning"], correct_option_index: 1 }
      ]
    }
  ]
};

// ==========================================
// Operating System
// ==========================================

const operatingSystemData = {
  subject: {
    title: 'Operating System',
    description: 'Learn process management, memory management, file systems, scheduling algorithms, and synchronization in operating systems.',
  },
  quizzes: [
    {
      title: 'OS Concepts & Architecture',
      description: 'Basic OS concepts, process states, and fundamental terminology.',
      time_limit: 10,
      questions: [
        { question_text: "What is the main function of an operating system?", options: ["To compile programs", "To manage hardware resources and provide services to applications", "To design user interfaces", "To connect to the internet"], correct_option_index: 1 },
        { question_text: "Which of the following is NOT an operating system?", options: ["Windows", "Linux", "Oracle", "macOS"], correct_option_index: 2 },
        { question_text: "What is a process in an operating system?", options: ["A file stored on disk", "A program in execution", "A hardware component", "A user account"], correct_option_index: 1 },
        { question_text: "What does CPU scheduling determine?", options: ["Which process gets to use the CPU and for how long", "How much RAM to allocate", "Which files to open", "How to connect to a network"], correct_option_index: 0 },
        { question_text: "What is virtual memory?", options: ["Extra RAM installed on the motherboard", "A technique that uses disk space to extend apparent physical memory", "Memory used by virtual machines only", "Cache memory in the CPU"], correct_option_index: 1 },
        { question_text: "Which state is a process in when it is waiting for an I/O operation to complete?", options: ["Running", "Ready", "Blocked/Waiting", "Terminated"], correct_option_index: 2 },
        { question_text: "What is a thread?", options: ["A separate process with its own memory space", "A lightweight unit of execution within a process", "A type of file system", "A network protocol"], correct_option_index: 1 },
        { question_text: "What does FIFO stand for in scheduling?", options: ["First In, First Out", "Fast Input, Fast Output", "File In, File Out", "First Instruction, Final Output"], correct_option_index: 0 },
        { question_text: "What is a deadlock?", options: ["When a process finishes execution", "A situation where two or more processes are unable to proceed because each is waiting for the other", "When the CPU is idle", "A type of memory allocation"], correct_option_index: 1 },
        { question_text: "What is the kernel of an operating system?", options: ["The user interface", "The core component that manages system resources and hardware interaction", "A type of shell", "An application program"], correct_option_index: 1 }
      ]
    },
    {
      title: 'Processes & Memory Management',
      description: 'Scheduling algorithms, memory management strategies, and synchronization.',
      time_limit: 15,
      questions: [
        { question_text: "In Round Robin scheduling, what happens when a process's time quantum expires?", options: ["The process is terminated", "The process is moved to the end of the ready queue", "The process gets additional time", "The process enters the blocked state"], correct_option_index: 1 },
        { question_text: "What is a page fault?", options: ["An error in the file system", "An event when a referenced page is not in physical memory and must be loaded from disk", "A hardware malfunction in RAM", "A syntax error in the page table"], correct_option_index: 1 },
        { question_text: "Which page replacement algorithm is theoretically optimal but impractical?", options: ["FIFO", "LRU", "Optimal (Bélády's algorithm)", "Clock algorithm"], correct_option_index: 2 },
        { question_text: "What is a semaphore used for?", options: ["Memory allocation", "Controlling access to shared resources by multiple processes", "File compression", "Network routing"], correct_option_index: 1 },
        { question_text: "What are the four necessary conditions for deadlock (Coffman conditions)?", options: ["Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait", "Starvation, Livelock, Race Condition, Priority Inversion", "Scheduling, Dispatching, Interrupting, Terminating", "Paging, Segmentation, Swapping, Caching"], correct_option_index: 0 },
        { question_text: "What is the difference between internal and external fragmentation?", options: ["Internal is wasted space within allocated blocks; external is wasted space between allocated blocks", "Internal occurs in RAM; external occurs on disk", "Internal is caused by paging; external by threading", "There is no difference"], correct_option_index: 0 },
        { question_text: "Which scheduling algorithm can lead to starvation of low-priority processes?", options: ["Round Robin", "First-Come First-Served", "Priority Scheduling (without aging)", "Shortest Job Next"], correct_option_index: 2 },
        { question_text: "What is the purpose of the Translation Lookaside Buffer (TLB)?", options: ["To store frequently accessed files", "To cache recent page table entries for faster virtual-to-physical address translation", "To buffer network packets", "To store CPU instructions"], correct_option_index: 1 },
        { question_text: "In the Producer-Consumer problem, what is the role of the buffer?", options: ["To execute processes", "To temporarily store items produced by the producer until the consumer retrieves them", "To schedule CPU time", "To manage page faults"], correct_option_index: 1 },
        { question_text: "What is thrashing?", options: ["A CPU overclocking issue", "Excessive paging activity where the system spends more time swapping pages than executing processes", "A disk defragmentation process", "A type of scheduling algorithm"], correct_option_index: 1 }
      ]
    },
    {
      title: 'Storage, Deadlocks & Kernels',
      description: 'Advanced topics: disk scheduling, file systems, security, and distributed OS concepts.',
      time_limit: 20,
      questions: [
        { question_text: "In the Banker's Algorithm, what is the 'safe state'?", options: ["A state where no processes are running", "A state where the system can allocate resources to each process in some order and avoid deadlock", "A state where all resources are free", "A state where the CPU utilization is below 50%"], correct_option_index: 1 },
        { question_text: "What is the difference between preemptive and non-preemptive scheduling?", options: ["Preemptive allows the OS to forcibly remove a process from the CPU; non-preemptive does not", "Non-preemptive is faster than preemptive", "Preemptive only works with I/O-bound processes", "There is no practical difference"], correct_option_index: 0 },
        { question_text: "What is the working set model in memory management?", options: ["The total physical memory available", "The set of pages a process is actively using during a time window, used to determine its memory needs", "A list of all processes in the ready queue", "The minimum RAM required to boot the OS"], correct_option_index: 1 },
        { question_text: "In SCAN (Elevator) disk scheduling, how does the disk arm move?", options: ["Randomly to requested tracks", "It moves in one direction servicing requests, then reverses direction", "It always moves to the nearest request", "It services requests in FIFO order"], correct_option_index: 1 },
        { question_text: "What is the purpose of an inode in Unix file systems?", options: ["To store the file name", "To store metadata about a file (permissions, size, pointers to data blocks)", "To index network connections", "To manage swap space"], correct_option_index: 1 },
        { question_text: "What is priority inversion and how is it typically solved?", options: ["When a high-priority process is blocked by a low-priority one; solved by priority inheritance", "When processes are scheduled in reverse order; solved by reordering the queue", "When the CPU idles despite ready processes; solved by increasing clock speed", "When two processes have the same priority; solved by random selection"], correct_option_index: 0 },
        { question_text: "What is the difference between a monolithic kernel and a microkernel?", options: ["Monolithic kernels run all OS services in kernel space; microkernels run most services in user space", "Microkernels are always faster", "Monolithic kernels cannot support multiple processes", "There is no architectural difference"], correct_option_index: 0 },
        { question_text: "In the Readers-Writers problem, what does 'writer starvation' mean?", options: ["Writers consume too much CPU", "Writers are indefinitely delayed because readers continuously hold the resource", "Writers cannot create files", "Writers are terminated by the OS"], correct_option_index: 1 },
        { question_text: "What is Copy-on-Write (COW) in the context of fork()?", options: ["Both parent and child immediately get separate copies of all memory", "Parent and child share the same memory pages until one writes, then only modified pages are copied", "The child process cannot write to memory", "Memory is copied to disk before forking"], correct_option_index: 1 },
        { question_text: "What is the purpose of a spinlock, and when is it preferred over a mutex?", options: ["A spinlock puts the thread to sleep; preferred for long waits", "A spinlock busy-waits in a loop; preferred for very short critical sections where context switch overhead exceeds wait time", "A spinlock is always faster than a mutex", "A spinlock is used only in user-space programs"], correct_option_index: 1 }
      ]
    }
  ]
};

// ==========================================
// Theory of Computation
// ==========================================

const theoryOfComputationData = {
  subject: {
    title: 'Theory of Computation',
    description: 'Explore automata theory, formal languages, Turing machines, computability, and complexity classes.',
  },
  quizzes: [
    {
      title: 'Automata & Regular Languages',
      description: 'Basic concepts of automata, regular languages, and finite automata.',
      time_limit: 10,
      questions: [
        { question_text: "What is an alphabet in the theory of computation?", options: ["A set of English letters", "A finite non-empty set of symbols", "An infinite set of characters", "A programming language keyword set"], correct_option_index: 1 },
        { question_text: "What does DFA stand for?", options: ["Dynamic Finite Automaton", "Deterministic Finite Automaton", "Distributed Functional Algorithm", "Discrete Formal Analyzer"], correct_option_index: 1 },
        { question_text: "In a DFA, how many transitions are allowed from a state for a given input symbol?", options: ["Zero", "Exactly one", "At most two", "Any number"], correct_option_index: 1 },
        { question_text: "What is a regular expression?", options: ["A mathematical equation", "A pattern that describes a set of strings (a regular language)", "A type of Turing machine", "A sorting algorithm"], correct_option_index: 1 },
        { question_text: "Which device recognizes regular languages?", options: ["Pushdown Automaton", "Turing Machine", "Finite Automaton", "Linear Bounded Automaton"], correct_option_index: 2 },
        { question_text: "What is a string in formal language theory?", options: ["A data type in programming", "A finite sequence of symbols from an alphabet", "An infinite sequence of characters", "A type of grammar"], correct_option_index: 1 },
        { question_text: "What is the empty string usually denoted by?", options: ["∅", "ε (epsilon)", "λ (lambda) or ε", "0"], correct_option_index: 2 },
        { question_text: "Which of the following is true about NFA (Nondeterministic Finite Automaton)?", options: ["It can have multiple transitions for the same input from a state", "It is more powerful than a DFA in terms of language recognition", "It cannot have epsilon transitions", "It always has fewer states than an equivalent DFA"], correct_option_index: 0 },
        { question_text: "What is a language in automata theory?", options: ["A programming language like Java", "A set of strings over an alphabet", "A natural language like English", "A machine instruction set"], correct_option_index: 1 },
        { question_text: "The Kleene star (Σ*) of an alphabet Σ represents:", options: ["Only the empty string", "All strings of length exactly one", "The set of all possible strings over Σ, including the empty string", "Only strings of even length"], correct_option_index: 2 }
      ]
    },
    {
      title: 'Context-Free Grammars & PDA',
      description: 'Context-free grammars, pushdown automata, and pumping lemma.',
      time_limit: 15,
      questions: [
        { question_text: "What type of grammar generates context-free languages?", options: ["Type 0 (Unrestricted)", "Type 1 (Context-Sensitive)", "Type 2 (Context-Free)", "Type 3 (Regular)"], correct_option_index: 2 },
        { question_text: "Which machine recognizes context-free languages?", options: ["DFA", "Pushdown Automaton (PDA)", "Turing Machine", "Finite Automaton"], correct_option_index: 1 },
        { question_text: "What is the Pumping Lemma for regular languages used for?", options: ["Proving a language is regular", "Proving a language is NOT regular", "Constructing DFAs", "Minimizing finite automata"], correct_option_index: 1 },
        { question_text: "In Chomsky Normal Form (CNF), productions are restricted to which forms?", options: ["A → BC or A → a (where A, B, C are variables and a is a terminal)", "A → aB only", "A → ε only", "A → aBc or A → BC"], correct_option_index: 0 },
        { question_text: "What additional feature does a PDA have compared to a finite automaton?", options: ["Multiple tapes", "A stack (LIFO memory)", "Infinite tape", "Random access memory"], correct_option_index: 1 },
        { question_text: "The language {aⁿbⁿ | n ≥ 0} is:", options: ["Regular", "Context-free but not regular", "Context-sensitive but not context-free", "Recursively enumerable only"], correct_option_index: 1 },
        { question_text: "What is an ambiguous grammar?", options: ["A grammar that generates no strings", "A grammar where at least one string has more than one parse tree (leftmost derivation)", "A grammar with only terminal symbols", "A grammar that is not in CNF"], correct_option_index: 1 },
        { question_text: "In the Chomsky Hierarchy, which type is the most restrictive?", options: ["Type 0", "Type 1", "Type 2", "Type 3"], correct_option_index: 3 },
        { question_text: "What is a derivation in a context-free grammar?", options: ["A mathematical proof", "A sequence of rule applications to produce a string from the start symbol", "A method to minimize automata", "A type of Turing machine operation"], correct_option_index: 1 },
        { question_text: "Can every NFA be converted to an equivalent DFA?", options: ["Yes, using the subset construction (powerset construction)", "No, NFAs are strictly more powerful", "Only if the NFA has no epsilon transitions", "Only for regular languages with a finite number of strings"], correct_option_index: 0 }
      ]
    },
    {
      title: 'Turing Machines & Complexity',
      description: 'Turing machines, decidability, reducibility, and computational complexity.',
      time_limit: 20,
      questions: [
        { question_text: "What is the Church-Turing thesis?", options: ["Every DFA can simulate a Turing machine", "Any function computable by an algorithm can be computed by a Turing machine", "All languages are decidable", "P = NP"], correct_option_index: 1 },
        { question_text: "What is an undecidable problem?", options: ["A problem with no input", "A problem for which no Turing machine can always halt and give a correct yes/no answer", "A problem solvable in polynomial time", "A problem that only PDAs can solve"], correct_option_index: 1 },
        { question_text: "The Halting Problem is:", options: ["Decidable", "Undecidable", "Regular", "Context-free"], correct_option_index: 1 },
        { question_text: "What is a Turing-recognizable (recursively enumerable) language?", options: ["A language decided by a DFA", "A language where a Turing machine halts and accepts for all strings in the language (but may loop on strings not in it)", "A language generated by a regular grammar", "A language with a finite number of strings"], correct_option_index: 1 },
        { question_text: "What does it mean for a problem to be NP-complete?", options: ["It can be solved in polynomial time", "It is in NP and every problem in NP can be reduced to it in polynomial time", "It cannot be solved by any machine", "It is only solvable by nondeterministic machines"], correct_option_index: 1 },
        { question_text: "What is a reduction in computability theory?", options: ["Simplifying a grammar", "Transforming one problem into another to show relative difficulty", "Minimizing the states of an automaton", "Compressing input data"], correct_option_index: 1 },
        { question_text: "Rice's Theorem states that:", options: ["All properties of regular languages are decidable", "Every non-trivial semantic property of the language of a Turing machine is undecidable", "All context-free languages are decidable", "The complement of every decidable language is undecidable"], correct_option_index: 1 },
        { question_text: "What is the difference between P and NP?", options: ["P = problems solvable in polynomial time; NP = problems whose solutions can be verified in polynomial time", "P and NP are the same class", "P contains only decision problems; NP contains optimization problems", "NP problems cannot be solved at all"], correct_option_index: 0 },
        { question_text: "What is a multi-tape Turing machine, and is it more powerful than a single-tape one?", options: ["It has multiple tapes and is strictly more powerful", "It has multiple tapes but is equivalent in power to a single-tape TM (can simulate each other)", "It can only be used for context-sensitive languages", "It requires exponentially more time than a single-tape TM"], correct_option_index: 1 },
        { question_text: "What does the Cook-Levin theorem prove?", options: ["That the Halting Problem is undecidable", "That SAT (Boolean Satisfiability) is NP-complete", "That P ≠ NP", "That every context-free language is in P"], correct_option_index: 1 }
      ]
    }
  ]
};

// ==========================================
// Seeding Helper Functions
// ==========================================

async function seedSubjectDataset(dataset) {
  const { subject: subjectMeta, quizzes } = dataset;
  console.log(`\n========================================`);
  console.log(`Processing Subject: "${subjectMeta.title}"`);
  console.log(`========================================`);

  // 1. Check if subject exists or insert it
  let subjectId;
  const { data: existingSubject, error: findSubjectError } = await supabase
    .from('subjects')
    .select('id, title')
    .eq('title', subjectMeta.title)
    .maybeSingle();

  if (findSubjectError) {
    console.error(`Error querying subject "${subjectMeta.title}":`, findSubjectError.message);
    return;
  }

  if (existingSubject) {
    console.log(`✓ Subject already exists: "${existingSubject.title}" (ID: ${existingSubject.id})`);
    subjectId = existingSubject.id;
  } else {
    const { data: newSubject, error: insertSubjectError } = await supabase
      .from('subjects')
      .insert({
        title: subjectMeta.title,
        description: subjectMeta.description,
      })
      .select()
      .single();

    if (insertSubjectError) {
      console.error(`Error inserting subject "${subjectMeta.title}":`, insertSubjectError.message);
      return;
    }
    console.log(`+ Created subject: "${newSubject.title}" (ID: ${newSubject.id})`);
    subjectId = newSubject.id;
  }

  // 2. Iterate through quizzes for this subject
  for (const quizData of quizzes) {
    console.log(`\n  Checking Quiz: "${quizData.title}"...`);

    const { data: existingQuiz, error: findQuizError } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('subject_id', subjectId)
      .eq('title', quizData.title)
      .maybeSingle();

    if (findQuizError) {
      console.error(`  Error querying quiz "${quizData.title}":`, findQuizError.message);
      continue;
    }

    let quizId;
    if (existingQuiz) {
      console.log(`  ✓ Quiz already exists: "${existingQuiz.title}" (ID: ${existingQuiz.id})`);
      quizId = existingQuiz.id;
    } else {
      const { data: newQuiz, error: insertQuizError } = await supabase
        .from('quizzes')
        .insert({
          subject_id: subjectId,
          title: quizData.title,
          description: quizData.description,
          time_limit: quizData.time_limit,
        })
        .select()
        .single();

      if (insertQuizError) {
        console.error(`  Error creating quiz "${quizData.title}":`, insertQuizError.message);
        continue;
      }
      console.log(`  + Created quiz: "${newQuiz.title}" (ID: ${newQuiz.id})`);
      quizId = newQuiz.id;
    }

    // 3. Check if questions are already seeded for this quiz
    const { count, error: countError } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quizId);

    if (countError) {
      console.error(`  Error checking existing questions for quiz "${quizData.title}":`, countError.message);
      continue;
    }

    if (count && count > 0) {
      console.log(`  ✓ Quiz "${quizData.title}" already has ${count} questions. Skipping question insertion.`);
    } else {
      console.log(`  + Inserting ${quizData.questions.length} questions for "${quizData.title}"...`);
      const questionsToInsert = quizData.questions.map((q) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
      }));

      const { error: insertQuestionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (insertQuestionsError) {
        console.error(`  Error inserting questions for "${quizData.title}":`, insertQuestionsError.message);
      } else {
        console.log(`  ✓ Successfully inserted ${questionsToInsert.length} questions for "${quizData.title}"!`);
      }
    }
  }
}

async function seedData() {
  console.log("Starting database seeding process...");
  try {
    // 1. Seed Java Programming
    await seedSubjectDataset(javaProgrammingData);

    // 2. Seed Computer Simulation and Modelling
    await seedSubjectDataset(computerSimulationData);

    // 3. Seed Data Mining
    await seedSubjectDataset(dataMiningData);

    // 4. Seed Machine Learning
    await seedSubjectDataset(machineLearningData);

    // 5. Seed Operating System
    await seedSubjectDataset(operatingSystemData);

    // 6. Seed Theory of Computation
    await seedSubjectDataset(theoryOfComputationData);

    console.log("\n========================================");
    console.log("Seeding process completed successfully!");
    console.log("========================================");
  } catch (err) {
    console.error("Unexpected error during seeding:", err);
  }
}

seedData();
