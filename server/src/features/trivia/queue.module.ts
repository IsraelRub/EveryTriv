import { Module } from "@nestjs/common";
import { PriorityQueue } from "./services/priority-queue";

@Module({
  providers: [
    {
      provide: "QUEUE_SERVICE",
      useFactory: () => new PriorityQueue(),
    },
  ],
  exports: ["QUEUE_SERVICE"],
})
export class QueueModule {}
