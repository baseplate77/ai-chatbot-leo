// import { import_ } from '@brillout/import'

// // export const loadModel = async () => {
// //   let { pipeline, env, AutoTokenizer } = await import_("@xenova/transformers");
// //   env.localModelPath = "./models/";

// //   let pipe = await pipeline(
// //     "zero-shot-classification",
// //     "typeform/distilbert-base-uncased-mnli",
// //     { local_files_only: true, cache_dir: "/" }
// //   );
// //   let out = await pipe(
// //     "your course is too expensive for me",

// //     [
// //       "interested Notification course",
// //       "discount Notification course",
// //       "Interest Flutter",
// //       "Interest Flutter Newsletter",
// //     ],
// //     {
// //       multi_label: true,
// //     }
// //   );

// //   console.log(out);
// // };



// class AIService {

//   private pipe: any
//   private static instance: AIService

//   constructor() {
//     this.loadModel()
//   }


//   public static getInstance(): AIService {
//     if (!AIService.instance) {
//       AIService.instance = new AIService()
//     }
//     return AIService.instance
//   }

//   async loadModel() {

//     try {

//       let { pipeline, env } = await import_("@xenova/transformers");

//       env.localModelPath = "./models/";

//       this.pipe = await pipeline(
//         "zero-shot-classification",
//         "typeform/distilbert-base-uncased-mnli",
//         { local_files_only: true, cache_dir: "/" }
//       );
//     } catch (error) {
//       console.log("unable to load the model due to :", error);

//       throw error
//     }
//   }

//   async runQuery(query: string, indentFilter: string[]) {
//     try {
//       var startTime = performance.now()
//       if (this.pipe === undefined) await this.loadModel()

//       let out = await this.pipe(
//         "your course is too expensive for me",

//         [
//           "interested Notification course",
//           "discount Notification course",
//           "Interest Flutter",
//           "Interest Flutter Newsletter",
//         ],
//         {
//           multi_label: true,
//         }
//       );

//       console.log(out);

//       var endTime = performance.now()

//       console.log(`Call to doSomething took ${(endTime - startTime) / 1000} seconds`)
//     } catch (error) {
//       console.log("Failed to run the query => :", error);
//       throw `Failed to run query => ${error}`

//     }
//   }


// }



// let aiService = AIService.getInstance()

// export default aiService