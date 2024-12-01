import React, { Component } from "react";
import StreamGraph from "./SteamGraph.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data : [
      ]
      
    };
  }

  set_data = (csv_data) => {
    this.setState({ data: csv_data });
  }

  render() {
    return (
      <div>
        <div className="parent">
          <StreamGraph></StreamGraph>
        </div>
      </div>
    );
  }
}

export default App;
