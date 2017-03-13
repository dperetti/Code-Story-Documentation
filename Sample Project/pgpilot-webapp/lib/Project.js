const collection = new Meteor.Collection('projects')

class Project {
  constructor() {
    this.KEY = 'default-project'
    if (Meteor.isServer) {
      collection.remove({});
      this.project_id = collection.insert({ key: this.KEY, name: 'Blah' });
      // console.log(project_id);
    } else {
      // console.log(collection.find({}).fetch());
      // var project = collection.findOne({key: KEY});
      // project_id = project._id
      // console.log(project_id);
    }
  }
  set(obj) {
    const project = collection.findOne({ key: this.KEY })
    collection.update(project._id, { $set: obj })
  }

  get(key) {
    try {
      return collection.findOne({ key: this.KEY })[key]
    } catch (e) {
      return undefined;
    }
  }

  project() {
    return collection.findOne({ key: this.KEY })
  }
}

export default new Project()
