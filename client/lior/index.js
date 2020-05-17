const fullStar = '★';
const emptyStar = '☆';

const commitFragment = `
fragment commitFragment on Repository {
  ref(qualifiedName: "master") {
    target {
      ... on Commit {
        history {
          totalCount
        }
      }
    }
  }
}
`;

const queryRepoList = `
{
  viewer {
    name
    # repos: repositoriesContributedTo(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
    repos: repositories(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {  
      totalCount
      nodes {
        id
        name
        viewerHasStarred
        issues(states: OPEN) {
          totalCount
        }
        pullRequests(states: OPEN) {
          totalCount
        }
        ... commitFragment
      }
    }
  }
}
` + commitFragment;

const mutationAddStar = `
mutation ($id: ID!){
  addStar(input: {starrableId: $id}) {
    starrable {
      ... on Repository {
        name
        viewerHasStarred
      }
    }
  }
}
`;

const mutationRemoveStar = `
mutation ($id: ID!){
  removeStar(input: {starrableId: $id}) {
    starrable {
      ... on Repository {
        name
        viewerHasStarred
      }
    }
  }
}
`;

// get my GitHub user name
const sampleQuery =
  `query { 
    viewer { 
      name
    }
  }
  `;

async function gqlRequest(query, variables) {
  
  const token = ''; // put here your personal GitHub token
  
  if (!token) {
    throw new Error('missing auth token');
  }

  // make graphql request
  // in case of error will return undefined
  return fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `bearer ${token}`
    },
    body: JSON.stringify({
      query: query,
      variables: variables
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Fetch failed (Network response error)'); // for example, error 401 if token is invalid
      }
      return response.json();
    })
    .then(jsonRes => {
      if (jsonRes.errors) {
        console.error('GraphQL errors:\n', jsonRes.errors); // applicative errors, for example, invalid query (wrong field name)
        throw new Error('Fetch failed (GraphQL applicative errors)');
      } else {
        return jsonRes.data;
      }
    })
    // .catch(error => {
    //   console.error('Fetch failed:', error); // for example, net::ERR_NAME_NOT_RESOLVED (url domain is wrong)
    // });
}

function testConnection() {
  gqlRequest(sampleQuery, {}, (data) => {})
}

function starHandler(element) {
  // star or unstar repo based on element state
  if (element.innerText === emptyStar) {
    addStarHandler(element)
  } else {
    removeStarHandler(element)
  }
}

function addStarHandler(element) {
  gqlRequest(
      mutationAddStar,
      { id: element.id }
  )
  .then((data) => {
      if (data.addStar.starrable.viewerHasStarred) {
        element.innerText = fullStar;
      }
  });
}

function removeStarHandler(element) {
    gqlRequest(
      mutationRemoveStar,
      { id: element.id }
    )
    .then((data) => {
        if (!data.removeStar.starrable.viewerHasStarred) {
          element.innerText = emptyStar;
        }
    });
}

function renderRepo(node) {
  const star = node.viewerHasStarred ? fullStar : emptyStar;
  const repoElement = `
    <div>
      <h3>
        ${node.name}
        <span id=${node.id} class="star" onClick="starHandler(this)">${star}</span>
      </h3>
      <p>${node.issues.totalCount} open issues</p>
      <p>${node.pullRequests.totalCount} open pull requests</p>
      <p>${node.ref.target.history.totalCount} commits</p>
    </div>
  `
  const item = document.createElement('li');
  item.innerHTML = repoElement;
  document.querySelector('ul.repos').append(item);
}

function app() {
  // get name and repositories for viewer
  gqlRequest(queryRepoList, {})
  .then((data) => {
      const name = data.viewer.name;
      document.querySelector('header h2').innerText = `Hello ${name}`;

      const repos = data.viewer.repos;
      if (repos.totalCount > 0) {
        document.querySelector('ul.repos').textContent = null;
        repos.nodes.forEach((node) => {
          renderRepo(node);
        });
      }
  });
}

document.addEventListener('DOMContentLoaded', (event) => { 
  // testConnection();
  app();
});
